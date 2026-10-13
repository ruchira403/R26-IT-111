import os
import json
import time
import numpy as np
import tensorflow as tf
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.utils.class_weight import compute_class_weight
import matplotlib.pyplot as plt

#  CONFIGURATIONS

CONFIG = {
    "DATA_DIR"        : "./01_Dataset/Flip_Detection_Data/",
    "OUTPUT_DIR"      : "./outputs_flip_detector_v1/",
    "IMAGE_SIZE"      : (224, 224),
    "BATCH_SIZE"      : 32,
    "EPOCHS_FROZEN"   : 20, 
    "EPOCHS_FINETUNE" : 15,
    "INIT_LR"         : 1e-3,
    "FINE_LR"         : 1e-5,
    "RANDOM_STATE"    : 42
}

os.makedirs(CONFIG["OUTPUT_DIR"], exist_ok=True)

print("=" * 70)

print("   Stage 1: Binary Flip Detection Module  |  Training Script v1.0")
print("=" * 70)


#  1. SCAN DATASET & STRATIFIED SPLIT

def load_dataset_paths():
    categories = ["Normal", "Flipped"]
    all_paths = []
    all_labels = []
    
    for idx, cat in enumerate(categories):
        cat_path = os.path.join(CONFIG["DATA_DIR"], cat)
        if not os.path.exists(cat_path):
            raise FileNotFoundError(f"[ERROR] Category folder not found: {cat_path}")
            
        files = [os.path.join(cat_path, f) for f in os.listdir(cat_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        print(f"  {cat:<15}: {len(files)} images")
        
        all_paths.extend(files)
        all_labels.extend([idx] * len(files))
        
    return np.array(all_paths), np.array(all_labels), categories

print("\n[STEP 1] Scanning Stage 1 Dataset...")
all_paths, all_labels, class_names = load_dataset_paths()

# Stratified Split (80% Train, 20% Val)
sss = StratifiedShuffleSplit(n_splits=1, test_size=0.2, random_state=CONFIG["RANDOM_STATE"])
train_idx, val_idx = next(sss.split(all_paths, all_labels))

train_paths, train_labels = all_paths[train_idx], all_labels[train_idx]
val_paths, val_labels = all_paths[val_idx], all_labels[val_idx]

print(f"\n  Total Images : {len(all_paths)}")
print(f"  Train Set    : {len(train_paths)} ({np.sum(train_labels==0)} Normal, {np.sum(train_labels==1)} Flipped)")
print(f"  Val Set      : {len(val_paths)} ({np.sum(val_labels==0)} Normal, {np.sum(val_labels==1)} Flipped)")

# Compute Class Weights
weights = compute_class_weight('balanced', classes=np.unique(train_labels), y=train_labels)
class_weights = {i: w for i, w in enumerate(weights)}
print(f"\n  Calculated Class Weights: Normal={class_weights[0]:.4f}, Flipped={class_weights[1]:.4f}")


#  2. TF.DATA PIPELINE

def process_image(file_path, label):
    img = tf.io.read_file(file_path)
    img = tf.image.decode_jpeg(img, channels=3)
    img = tf.image.resize(img, CONFIG["IMAGE_SIZE"])
    # MobileNetV2 preprocessing 
    img = tf.keras.applications.mobilenet_v2.preprocess_input(img)
    return img, label

train_ds = tf.data.Dataset.from_tensor_slices((train_paths, train_labels))
train_ds = train_ds.shuffle(buffer_size=len(train_paths), seed=CONFIG["RANDOM_STATE"])
train_ds = train_ds.map(process_image, num_parallel_calls=tf.data.AUTOTUNE)
train_ds = train_ds.batch(CONFIG["BATCH_SIZE"]).prefetch(tf.data.AUTOTUNE)

val_ds = tf.data.Dataset.from_tensor_slices((val_paths, val_labels))
val_ds = val_ds.map(process_image, num_parallel_calls=tf.data.AUTOTUNE)
val_ds = val_ds.batch(CONFIG["BATCH_SIZE"]).prefetch(tf.data.AUTOTUNE)


#  3. MODEL BUILD (MobileNetV2)

print("\n[STEP 2] Building Stage 1 Binary Model (MobileNetV2)...")
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(*CONFIG["IMAGE_SIZE"], 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False  # Freeze base model initially

inputs = tf.keras.Input(shape=(*CONFIG["IMAGE_SIZE"], 3))
x = base_model(inputs, training=False)
x = tf.keras.layers.GlobalAveragePooling2D()(x)
x = tf.keras.layers.Dropout(0.3)(x)
outputs = tf.keras.layers.Dense(1, activation='sigmoid')(x) # Sigmoid for Binary

model = tf.keras.Model(inputs, outputs)
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=CONFIG["INIT_LR"]),
    loss='binary_crossentropy',
    metrics=['accuracy', tf.keras.metrics.Precision(name='precision'), tf.keras.metrics.Recall(name='recall')]
)


#  4. TRAINING - PHASE 1: FROZEN

print("\n[STEP 3] Starting Phase 1: Training Head Layers (Frozen Base)...")
callbacks = [
    tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
    tf.keras.callbacks.ModelCheckpoint(os.path.join(CONFIG["OUTPUT_DIR"], "best_flip_detector.keras"), monitor='val_loss', save_best_only=True)
]

history_frozen = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=CONFIG["EPOCHS_FROZEN"],
    class_weight=class_weights,
    callbacks=callbacks
)


#  5. TRAINING - PHASE 2: FINE-TUNING

print("\n[STEP 4] Starting Phase 2: Fine-Tuning Top Layers...")
base_model.trainable = True
# Fine-tune blocks 13 to 16 (Top layers)
for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=CONFIG["FINE_LR"]),
    loss='binary_crossentropy',
    metrics=['accuracy', tf.keras.metrics.Precision(name='precision'), tf.keras.metrics.Recall(name='recall')]
)

history_fine = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=CONFIG["EPOCHS_FINETUNE"],
    class_weight=class_weights,
    callbacks=callbacks
)

#  6. SAVE & EVALUATE

print("\n[STEP 5] Evaluating Model...")
loss, acc, prec, rec = model.evaluate(val_ds)
print("\n" + "=" * 50)
print(f"  Final Stage 1 Validation Accuracy : {acc*100:.2f}%")
print(f"  Precision : {prec:.4f} | Recall : {rec:.4f}")
print("=" * 50)

# Save Metadata
meta = {
    "model_type": "Stage 1 - Binary Flip Detector",
    "accuracy": f"{acc*100:.2f}%",
    "classes": ["Normal", "Flipped"]
}
with open(os.path.join(CONFIG["OUTPUT_DIR"], "model_metadata.json"), "w") as f:
    json.dump(meta, f, indent=4)

print(f"\n Model and logs successfully saved to: {CONFIG['OUTPUT_DIR']}")