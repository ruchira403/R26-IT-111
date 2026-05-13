# Standard Library 
import os, sys, time, json, warnings, shutil
from pathlib import Path
from collections import defaultdict

# Third-Party
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

# TensorFlow / Keras
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, callbacks, regularizers
from tensorflow.keras.applications import EfficientNetB0

# Scikit-Learn
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.utils.class_weight import compute_class_weight

warnings.filterwarnings("ignore")

#  SECTION 1 CONFIGURATION 

CONFIG = {
    "TRAIN_DIR"       : "../01_Dataset/Orientation_Data/train/",
    "OUTPUT_DIR"      : "./outputs_v4/",
    "MODEL_FILENAME"  : "dental_validation_model_v4.keras",
    "CLASS_NAMES"     : ["0_Correct", "1_Rotate_90", "2_Rotate_180",
                         "3_Rotate_270", "4_Non_Dental"],
    "NUM_CLASSES"     : 5,
    "IMG_SIZE"        : (224, 224),
    "INPUT_SHAPE"     : (224, 224, 3),
    "VALID_EXTENSIONS": {".jpg", ".jpeg", ".png", ".bmp"},
    # Stratified split guarantees all 5 classes appear in validation
    "VALIDATION_SPLIT": 0.20,
    "RANDOM_SEED"     : 42,
    "DENSE_UNITS"     : 256,
    "DROPOUT_RATE"    : 0.50,
    "L2_LAMBDA"       : 2e-4,
    "LABEL_SMOOTHING" : 0.10,
    "BATCH_SIZE"      : 16,          
    "EPOCHS_FROZEN"   : 40,
    "EPOCHS_FINETUNE" : 30,
    "INITIAL_LR"      : 5e-4,
    "FINE_TUNE_LR"    : 1e-5,
    "UNFREEZE_LAYERS" : 20,          
    "ES_PATIENCE"     : 12,
    "ES_MIN_DELTA"    : 1e-4,

    "INTER_THREADS"   : 2,
    "INTRA_THREADS"   : 4,
    "PREFETCH"        : tf.data.AUTOTUNE,
    "NUM_WORKERS"     : 4,
}

#  SECTION 2 ENVIRONMENT SETUP

def setup_environment(cfg: dict) -> None:
    np.random.seed(cfg["RANDOM_SEED"])
    tf.random.set_seed(cfg["RANDOM_SEED"])

    tf.config.threading.set_inter_op_parallelism_threads(cfg["INTER_THREADS"])
    tf.config.threading.set_intra_op_parallelism_threads(cfg["INTRA_THREADS"])
    os.environ["TF_ENABLE_ONEDNN_OPTS"] = "1"
    os.environ["TF_CPP_MIN_LOG_LEVEL"]  = "2"

    Path(cfg["OUTPUT_DIR"]).mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print("  Automated X-ray Validation Module  |  Training Script v4.0")
    print("=" * 70)
    print(f"  TensorFlow    : {tf.__version__}")
    print(f"  Strategy      : EfficientNetB0 + Stratified Split + tf.data")
    print(f"  Output Dir    : {Path(cfg['OUTPUT_DIR']).resolve()}")
    print("=" * 70)

#  SECTION 3 DATASET LOADING  (path-based, stratified)

def scan_dataset(cfg: dict):
    """
    Walk the train directory and collect (image_path, label_index) pairs.
    Skips corrupt or unsupported files automatically.
    """
    train_path = Path(cfg["TRAIN_DIR"])
    if not train_path.exists():
        raise FileNotFoundError(
            f"\n[ERROR] Dataset folder not found:\n  {train_path.resolve()}\n"
            "  Check CONFIG['TRAIN_DIR']."
        )

    all_paths, all_labels = [], []
    print("\n── Dataset Scan ─")

    for idx, cls_name in enumerate(cfg["CLASS_NAMES"]):
        cls_path = train_path / cls_name
        if not cls_path.exists():
            print(f"  [WARNING] Missing folder: {cls_path}")
            continue

        # Collect valid image files only
        files = [
            f for f in cls_path.iterdir()
            if f.is_file() and f.suffix.lower() in cfg["VALID_EXTENSIONS"]
        ]
        all_paths.extend([str(f) for f in files])
        all_labels.extend([idx] * len(files))

        bar = "█" * (len(files) // 25)
        print(f"  {cls_name:<18}  {len(files):>5} images  {bar}")

    print(f"  {'TOTAL':<18}  {len(all_paths):>5} images")
    print("─" * 62)

    if len(all_paths) == 0:
        raise ValueError("No images found. Check your dataset folder structure.")

    return all_paths, all_labels


def stratified_split(all_paths, all_labels, cfg):
    """
    Stratified split — GUARANTEES every class appears in val set
    proportionally. This permanently fixes the '4_Non_Dental missing'
    problem from v3.x.
    """
    paths  = np.array(all_paths)
    labels = np.array(all_labels)

    sss = StratifiedShuffleSplit(
        n_splits    = 1,
        test_size   = cfg["VALIDATION_SPLIT"],
        random_state= cfg["RANDOM_SEED"],
    )
    train_idx, val_idx = next(sss.split(paths, labels))

    train_paths  = paths[train_idx].tolist()
    train_labels = labels[train_idx].tolist()
    val_paths    = paths[val_idx].tolist()
    val_labels   = labels[val_idx].tolist()

    print("\n── Stratified Split Results ──")
    print(f"  {'Class':<18}  {'Train':>6}  {'Val':>6}  {'Total':>6}")
    print("  " + "─" * 40)

    for idx, cls in enumerate(cfg["CLASS_NAMES"]):
        n_train = train_labels.count(idx)
        n_val   = val_labels.count(idx)
        flag    = "LOW" if n_val < 40 else ""
        print(f"  {cls:<18}  {n_train:>6}  {n_val:>6}  {n_train+n_val:>6}{flag}")

    print(f"  {'TOTAL':<18}  {len(train_labels):>6}  {len(val_labels):>6}  {len(all_labels):>6}")
    print("─" * 62)

    return train_paths, train_labels, val_paths, val_labels


def compute_class_weights_from_labels(train_labels, cfg):
    labels    = np.array(train_labels)
    classes   = np.unique(labels)
    weights   = compute_class_weight("balanced", classes=classes, y=labels)
    cw        = dict(zip(classes.tolist(), weights.tolist()))

    print("\n── Class Weights ─")
    for idx, cls in enumerate(cfg["CLASS_NAMES"]):
        print(f"  Class {idx}  {cls:<18}  w = {cw.get(idx, 1.0):.4f}")
    print("─" * 62)
    return cw

#  SECTION 4 tf.data PIPELINE
def load_and_preprocess(path, label, img_size, num_classes):
    """Load one image, decode, resize, preprocess for EfficientNet."""
    raw   = tf.io.read_file(path)
    image = tf.image.decode_image(raw, channels=3, expand_animations=False)
    image = tf.image.resize(image, img_size)
    image = tf.cast(image, tf.float32)
    label_oh = tf.one_hot(label, num_classes)
    return image, label_oh


def augment_image(image, label):
    """
    Training-time augmentation — dental-safe.
    NO horizontal or vertical flips (would corrupt orientation labels).
    Applied on CPU via tf.data map — works without GPU.
    """
    # Colour / exposure
    image = tf.image.random_brightness(image, max_delta=0.25)
    image = tf.image.random_contrast(image, lower=0.80, upper=1.20)

    # Spatial (mild)
    image = tf.image.random_crop(
        tf.image.resize_with_crop_or_pad(image, 240, 240),
        size=[224, 224, 3]
    )

    # Random JPEG quality (simulates compression artefacts in X-rays)
    image = tf.cast(image, tf.uint8)
    image = tf.image.random_jpeg_quality(image, 70, 100)
    image = tf.cast(image, tf.float32)

    # Clip to valid range
    image = tf.clip_by_value(image, 0.0, 255.0)
    return image, label


def build_tf_dataset(paths, labels, cfg, training=True):
    """
    Builds an optimised tf.data.Dataset pipeline.
    - Training: shuffle + augment + repeat
    - Validation: no shuffle, no augment, no repeat
    """
    img_size   = cfg["IMG_SIZE"]
    num_classes= cfg["NUM_CLASSES"]
    batch_size = cfg["BATCH_SIZE"]

    ds = tf.data.Dataset.from_tensor_slices((paths, labels))

    if training:
        ds = ds.shuffle(buffer_size=len(paths), seed=cfg["RANDOM_SEED"],
                        reshuffle_each_iteration=True)

    ds = ds.map(
        lambda p, l: load_and_preprocess(p, l, img_size, num_classes),
        num_parallel_calls=cfg["NUM_WORKERS"],
    )

    if training:
        ds = ds.map(augment_image, num_parallel_calls=cfg["NUM_WORKERS"])

    ds = ds.batch(batch_size).prefetch(cfg["PREFETCH"])
    return ds

#  SECTION 5 MODEL ARCHITECTURE

def build_model(cfg: dict) -> tf.keras.Model:
    """
    EfficientNetB0 (frozen) + regularized classification head.
    """
    l2 = regularizers.l2(cfg["L2_LAMBDA"])

    # Base (frozen) 
    base = EfficientNetB0(
        input_shape = cfg["INPUT_SHAPE"],
        include_top = False,
        weights     = "imagenet",
    )
    base.trainable = False

    #Head 
    inputs = tf.keras.Input(shape=cfg["INPUT_SHAPE"], name="image_input")
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D(name="gap")(x)

    x = layers.Dense(cfg["DENSE_UNITS"], kernel_regularizer=l2, name="dense_256")(x)
    x = layers.BatchNormalization(name="bn_256")(x)
    x = layers.Activation("relu", name="relu_256")(x)
    x = layers.Dropout(cfg["DROPOUT_RATE"], name="dropout")(x)

    outputs = layers.Dense(
        cfg["NUM_CLASSES"],
        activation = "softmax",
        name       = "predictions",
        dtype      = "float32",
    )(x)

    model = models.Model(inputs=inputs, outputs=outputs,
                         name="DentalValidator_v4")

    model.compile(
        optimizer = optimizers.Adam(learning_rate=cfg["INITIAL_LR"]),
        loss      = tf.keras.losses.CategoricalCrossentropy(
                        label_smoothing=cfg["LABEL_SMOOTHING"]
                    ),
        metrics   = [
            "accuracy",
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
        ],
    )

    # Summary
    trainable = sum(tf.size(v).numpy() for v in model.trainable_variables)
    total     = sum(tf.size(v).numpy() for v in model.variables)
    print(f"\n── Model : DentalValidator v4.0 (EfficientNetB0) ──")
    print(f"  Trainable params : {trainable:,}")
    print(f"  Total params     : {total:,}")
    print(f"  Label smoothing  : {cfg['LABEL_SMOOTHING']}")
    print(f"  L2 regularizer   : {cfg['L2_LAMBDA']}")
    print("─" * 62)
    return model


def unfreeze_top_layers(model: tf.keras.Model, cfg: dict) -> None:
    """Unfreeze top N layers of EfficientNetB0 for fine-tuning."""
    base = model.get_layer("efficientnetb0")
    base.trainable = True

    n = cfg["UNFREEZE_LAYERS"]
    for layer in base.layers[:-n]:
        layer.trainable = False

    model.compile(
        optimizer = optimizers.Adam(learning_rate=cfg["FINE_TUNE_LR"]),
        loss      = tf.keras.losses.CategoricalCrossentropy(
                        label_smoothing=cfg["LABEL_SMOOTHING"]
                    ),
        metrics   = [
            "accuracy",
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
        ],
    )
    unfrozen = sum(1 for l in base.layers if l.trainable)
    print(f"\n  [Fine-Tune] Unfrozen {unfrozen} EfficientNet layers")
    print(f"  [Fine-Tune] Learning rate → {cfg['FINE_TUNE_LR']}")

#  SECTION 6 CALLBACKS

def build_callbacks(cfg: dict, phase: str) -> list:
    out = Path(cfg["OUTPUT_DIR"])
    return [
        callbacks.EarlyStopping(
            monitor              = "val_accuracy",  
            patience             = cfg["ES_PATIENCE"],
            min_delta            = cfg["ES_MIN_DELTA"],
            mode                 = "max",
            restore_best_weights = True,
            verbose              = 1,
        ),
        callbacks.ModelCheckpoint(
            filepath         = str(out / f"best_{phase}.keras"),
            monitor          = "val_accuracy",
            save_best_only   = True,
            mode             = "max",
            verbose          = 1,
        ),
        callbacks.ReduceLROnPlateau(
            monitor  = "val_loss",
            factor   = 0.5,
            patience = 5,
            min_lr   = 1e-8,
            verbose  = 1,
        ),
        callbacks.CSVLogger(
            str(out / f"history_{phase}.csv"), append=False
        ),
    ]

#  SECTION 7 TRAINING

def train_phase(model, train_ds, val_ds, cfg,
                class_weights, epochs, phase,
                train_labels):
    """Run one training phase and print overfitting diagnostics."""

    n_train = sum(1 for _ in train_ds.unbatch())   
    steps_per_epoch = int(np.ceil(
        sum(class_weights[i] for i in train_labels) / cfg["BATCH_SIZE"]
    ))

    print(f"\n{'═'*70}")
    print(f"  PHASE : {phase.upper()}  |  Max epochs : {epochs}")
    print(f"{'═'*70}")

    t0 = time.time()
    history = model.fit(
        train_ds,
        epochs          = epochs,
        validation_data = val_ds,
        class_weight    = class_weights,
        callbacks       = build_callbacks(cfg, phase),
        verbose         = 1,
    )

    best_ep  = int(np.argmax(history.history["val_accuracy"]))
    tr_acc   = history.history["accuracy"][best_ep]
    val_acc  = history.history["val_accuracy"][best_ep]
    gap      = tr_acc - val_acc
    status   = "✓  HEALTHY" if gap <= 0.10 else (" MILD" if gap <= 0.20 else "✗  OVERFITTING")

    print(f"\n  Best epoch  : {best_ep + 1}")
    print(f"  Train acc   : {tr_acc:.4f}  ({tr_acc*100:.1f}%)")
    print(f"  Val acc     : {val_acc:.4f}  ({val_acc*100:.1f}%)")
    print(f"  Gap         : {gap:.4f}  →  {status}")
    print(f"  Phase time  : {(time.time()-t0)/60:.1f} min")
    return history

#  SECTION 8 EVALUATION
def evaluate_model(model, val_paths, val_labels, cfg):
    """
    Full evaluation using the raw path list — no generator bugs possible.
    Predicts batch-by-batch from the validated val split.
    """
    print("\n── Model Evaluation ──")

    class_names   = cfg["CLASS_NAMES"]
    label_indices = list(range(cfg["NUM_CLASSES"]))
    img_size      = cfg["IMG_SIZE"]

    #Predict 
    y_pred_all = []
    batch_size = cfg["BATCH_SIZE"]

    for i in range(0, len(val_paths), batch_size):
        batch_paths = val_paths[i : i + batch_size]
        batch_imgs  = []
        for p in batch_paths:
            raw   = tf.io.read_file(p)
            img   = tf.image.decode_image(raw, channels=3,
                                           expand_animations=False)
            img   = tf.image.resize(img, img_size)
            img   = tf.cast(img, tf.float32)
            batch_imgs.append(img)
        batch_tensor = tf.stack(batch_imgs, axis=0)
        preds = model.predict(batch_tensor, verbose=0)
        y_pred_all.extend(np.argmax(preds, axis=1).tolist())

        # Progress
        done = min(i + batch_size, len(val_paths))
        print(f"\r  Predicting  {done}/{len(val_paths)}", end="")

    print()

    y_pred = np.array(y_pred_all)
    y_true = np.array(val_labels)

    #Accuracy 
    overall_acc = np.mean(y_pred == y_true)
    print(f"\n  Overall Validation Accuracy : {overall_acc*100:.2f}%")
    if overall_acc >= 0.90:
        print(" TARGET MET (≥ 90%) — Ready for research submission!")
    else:
        print(f" {(0.90 - overall_acc)*100:.1f}% below target.")

    #Per-class accuracy 
    print(f"\n  {'Class':<18}  {'Correct':>8}  {'Total':>6}  {'Acc':>7}")
    print("  " + "─" * 45)
    for idx, cls in enumerate(class_names):
        mask    = y_true == idx
        correct = np.sum((y_pred == idx) & mask)
        total   = np.sum(mask)
        acc     = correct / total if total > 0 else 0.0
        bar     = "█" * int(acc * 20)
        print(f"  {cls:<18}  {correct:>8}  {total:>6}  {acc*100:>6.1f}%  {bar}")

    #Classification Report 
    report = classification_report(
        y_true, y_pred,
        labels       = label_indices,
        target_names = class_names,
        digits       = 4,
        zero_division= 0,
    )
    print(f"\n  Classification Report:\n\n{report}")

    report_path = Path(cfg["OUTPUT_DIR"]) / "classification_report.txt"
    with open(report_path, "w") as f:
        f.write("Automated X-ray Validation Module — Evaluation Report\n")
        f.write(f"Overall Accuracy: {overall_acc*100:.2f}%\n\n")
        f.write(report)
    print(f"  Saved → {report_path}")

    #Confusion Matrix 
    cm     = confusion_matrix(y_true, y_pred, labels=label_indices)
    row_s  = cm.sum(axis=1, keepdims=True)
    row_s[row_s == 0] = 1
    cm_pct = cm.astype(float) / row_s * 100
    short  = ["Correct", "Rot90", "Rot180", "Rot270", "NonDental"]

    fig, axes = plt.subplots(1, 2, figsize=(18, 7))
    fig.suptitle(
        f"DentalValidator v4.0 — Confusion Matrix  "
        f"(Overall Acc: {overall_acc*100:.1f}%)  |  it22092016",
        fontsize=13, fontweight="bold", y=1.01
    )
    sns.heatmap(cm,     annot=True, fmt="d",   cmap="Blues",  ax=axes[0],
                xticklabels=short, yticklabels=short,
                linewidths=0.5, linecolor="white")
    sns.heatmap(cm_pct, annot=True, fmt=".1f", cmap="Greens", ax=axes[1],
                xticklabels=short, yticklabels=short,
                linewidths=0.5, linecolor="white", vmin=0, vmax=100)

    for ax, title in zip(axes, ["Absolute Counts", "Row-Normalised (%)"]):
        ax.set_title(title, fontweight="bold")
        ax.set_ylabel("True Label")
        ax.set_xlabel("Predicted Label")
        ax.tick_params(axis="x", rotation=30)

    plt.tight_layout()
    cm_path = Path(cfg["OUTPUT_DIR"]) / "confusion_matrix.png"
    plt.savefig(cm_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  Saved → {cm_path}")

    return overall_acc, y_true, y_pred

#  SECTION 9 TRAINING HISTORY PLOT

def plot_history(h_frozen, h_finetune, cfg):
    def merge(k):
        return h_frozen.history.get(k, []) + h_finetune.history.get(k, [])

    split = len(h_frozen.history["loss"])
    pairs = [
        ("accuracy",  "val_accuracy",  "Accuracy"),
        ("loss",      "val_loss",      "Loss"),
        ("precision", "val_precision", "Precision"),
        ("recall",    "val_recall",    "Recall"),
    ]

    fig, axes = plt.subplots(2, 2, figsize=(16, 10))
    fig.suptitle("DentalValidator v4.0 — Training History  (it22092016)",
                 fontsize=14, fontweight="bold")

    for ax, (tr_k, vl_k, title) in zip(axes.flat, pairs):
        tr  = merge(tr_k);  vl = merge(vl_k)
        ep  = range(1, len(tr) + 1)
        ax.plot(ep, tr, "b-o", ms=3, label="Train")
        ax.plot(ep, vl, "r-s", ms=3, label="Validation")
        ax.axvline(x=split, color="gray", ls="--", alpha=0.7,
                   label="Fine-tune start")
        ax.set_title(title, fontweight="bold")
        ax.set_xlabel("Epoch"); ax.set_ylabel(title)
        ax.legend(); ax.grid(alpha=0.3)

    plt.tight_layout()
    path = Path(cfg["OUTPUT_DIR"]) / "training_history.png"
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  Training history saved → {path}")

#  SECTION 10 EXPORT

def export_model(model, cfg, overall_acc):
    out = Path(cfg["OUTPUT_DIR"])

    # Save native Keras format (no legacy warning)
    model_path = out / cfg["MODEL_FILENAME"]
    model.save(str(model_path))
    size_mb = model_path.stat().st_size / (1024 ** 2)
    print(f"\n  Model saved  → {model_path}  ({size_mb:.1f} MB)")

    # Also export .h5 for compatibility with older inference code
    h5_path = out / "dental_validation_model_v4.h5"
    model.save(str(h5_path))
    print(f"  H5 backup    → {h5_path}")

    # Class mapping
    mapping = {
        "class_map"      : {i: n for i, n in enumerate(cfg["CLASS_NAMES"])},
        "model_version"  : "v4.0",
        "overall_val_acc": round(float(overall_acc), 4),
        "input_shape"    : list(cfg["INPUT_SHAPE"]),
        "base_model"     : "EfficientNetB0",
    }
    map_path = out / "model_metadata.json"
    with open(map_path, "w") as f:
        json.dump(mapping, f, indent=2)
    print(f"  Metadata     → {map_path}")

#  SECTION 11 MAIN ORCHESTRATOR
def main():
    t_start = time.time()
    setup_environment(CONFIG)

    #1. Scan & Split 
    all_paths, all_labels             = scan_dataset(CONFIG)
    train_paths, train_labels, \
    val_paths,   val_labels           = stratified_split(all_paths, all_labels, CONFIG)
    class_weights                     = compute_class_weights_from_labels(
                                            train_labels, CONFIG)

    #2. tf.data Datasets 
    train_ds = build_tf_dataset(train_paths, train_labels, CONFIG, training=True)
    val_ds   = build_tf_dataset(val_paths,   val_labels,   CONFIG, training=False)

    #3. Build Model 
    model = build_model(CONFIG)

    #4. Phase 1: Train Head Only 
    h_frozen = train_phase(
        model, train_ds, val_ds, CONFIG,
        class_weights, CONFIG["EPOCHS_FROZEN"], "frozen", train_labels
    )

    #5. Phase 2: Fine-Tune Top Layers
    unfreeze_top_layers(model, CONFIG)
    h_finetune = train_phase(
        model, train_ds, val_ds, CONFIG,
        class_weights, CONFIG["EPOCHS_FINETUNE"], "finetune", train_labels
    )

    #6. Evaluate 
    overall_acc, y_true, y_pred = evaluate_model(
        model, val_paths, val_labels, CONFIG
    )

    #7. Plots & Export 
    plot_history(h_frozen, h_finetune, CONFIG)
    export_model(model, CONFIG, overall_acc)

    # 8. Final Summary 
    total_min = (time.time() - t_start) / 60
    target    = "TARGET MET" if overall_acc >= 0.90 else "TARGET NOT MET"

    print("\n" + "═" * 70)
    print("  TRAINING COMPLETE — DentalValidator v4.0")
    print(f"  Final Val Accuracy  : {overall_acc*100:.2f}%  {target}")
    print(f"  Total Time          : {total_min:.1f} min")
    print(f"  Model Location      : {Path(CONFIG['OUTPUT_DIR']).resolve()}")
    print("═" * 70)

#Entry Point
if __name__ == "__main__":
    main()