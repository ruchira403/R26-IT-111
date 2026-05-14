# ── Standard library ─────────────────────────────────────────────────────────
import sys
import time
import shutil
from pathlib import Path

# ── Third-party ──────────────────────────────────────────────────────────────
import pandas as pd
import matplotlib
matplotlib.use("Agg")          # non-interactive backend — safe on headless servers
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# ── Ultralytics ───────────────────────────────────────────────────────────────
try:
    from ultralytics import YOLO
except ImportError:
    sys.exit(
        "[ERROR] 'ultralytics' is not installed.\n"
        "  Run:  pip install ultralytics\n"
    )

# ═══════════════════════════════════════════════════════════════════════════════
#  1. PATH CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Using pathlib — handles Windows backslashes / forward slashes transparently
TRAIN_DIR = Path(r"D:\SLIIT\Research project\DENTAL_XRAY_PROJECT\Dataset\02_Member_Caries\train")

# Where Ultralytics saves all run artefacts (weights, metrics, plots …)
PROJECT_DIR = TRAIN_DIR.parent / "runs"
RUN_NAME    = "dental_cls_yolo11n"

# Sanity-check: make sure the training folder actually exists
if not TRAIN_DIR.exists():
    sys.exit(
        f"[ERROR] Training directory not found:\n  {TRAIN_DIR}\n"
        "  Please verify the path and try again."
    )

EXPECTED_CLASSES = [
    "Dental _Cavity_Train",
    "Healthy_Train",
    "Non_Dental",
    "Periodontal_Bone_Loss_Train",
]

found_classes = [d.name for d in TRAIN_DIR.iterdir() if d.is_dir()]
print("\n── Dataset Check ────────────────────────────────────────────────────────")
for cls in EXPECTED_CLASSES:
    status = "✓" if cls in found_classes else "✗ MISSING"
    print(f"  [{status}]  {cls}")

missing = [c for c in EXPECTED_CLASSES if c not in found_classes]
if missing:
    sys.exit(f"\n[ERROR] Missing class folders: {missing}")

print("  All 4 classes found. Proceeding …\n")


# ═══════════════════════════════════════════════════════════════════════════════
#  2. LOAD PRE-TRAINED MODEL
# ═══════════════════════════════════════════════════════════════════════════════

print("── Loading Model ────────────────────────────────────────────────────────")
model = YOLO("yolo11n-cls.pt")
print("  yolo11n-cls.pt loaded successfully.\n")


# ═══════════════════════════════════════════════════════════════════════════════
#  3. TRAINING
# ═══════════════════════════════════════════════════════════════════════════════

print("── Starting Training ────────────────────────────────────────────────────")
print(f"  Dataset  : {TRAIN_DIR}")
print(f"  Project  : {PROJECT_DIR}")
print(f"  Run name : {RUN_NAME}")
print(f"  Device   : CPU  (Intel i7-10750H optimised)")
print()

t0 = time.time()

results = model.train(
    # ── Data ──────────────────────────────────────────────────────────────────
    data        = str(TRAIN_DIR),   # root folder whose sub-dirs == class names
    # fraction  : carve 20 % of each class for validation (no separate val dir)
    # NOTE: Ultralytics ≥ 8.3 supports 'fraction'; older builds use the default
    # internal split.  If your version raises TypeError, remove this line.
    fraction    = 0.8,              # use 80 % for train, 20 % auto-val

    # ── Model I/O ─────────────────────────────────────────────────────────────
    project     = str(PROJECT_DIR),
    name        = RUN_NAME,
    exist_ok    = True,             # overwrite previous run of same name

    # ── Core hyperparameters ──────────────────────────────────────────────────
    epochs      = 50,               # enough for a 4-class nano model
    imgsz       = 224,              # ImageNet standard; pretrained weights match
    batch       = 8,                # safe batch size for 16 GB RAM on CPU
    workers     = 2,                # 2 data-loader workers; avoids RAM thrashing

    # ── Regularisation & early stopping ──────────────────────────────────────
    patience    = 10,               # stop if val/top1 doesn't improve for 10 ep
    dropout     = 0.2,              # light dropout for a 4-class problem

    # ── Optimiser ─────────────────────────────────────────────────────────────
    optimizer   = "Adam",           # Adam converges faster than SGD on CPU
    lr0         = 1e-3,             # initial learning rate
    lrf         = 0.01,             # final lr = lr0 × lrf (cosine schedule)
    weight_decay= 5e-4,

    # ── Augmentation (kept conservative for medical imaging) ─────────────────
    hsv_h       = 0.015,
    hsv_s       = 0.3,
    hsv_v       = 0.3,
    flipud      = 0.1,
    fliplr      = 0.5,
    degrees     = 10,               # small rotations relevant for X-rays

    # ── Hardware ──────────────────────────────────────────────────────────────
    device      = "cpu",            # EXPLICIT CPU — no CUDA dependency
    amp         = False,            # AMP requires CUDA; disable on CPU

    # ── Verbosity ─────────────────────────────────────────────────────────────
    verbose     = True,
    plots       = True,             # saves confusion matrix, train-batch mosaics
)

elapsed = time.time() - t0
print(f"\n── Training Complete  ({elapsed / 60:.1f} min) ──────────────────────────────")


# ═══════════════════════════════════════════════════════════════════════════════
#  4. LOCATE BEST WEIGHTS
# ═══════════════════════════════════════════════════════════════════════════════

run_dir   = PROJECT_DIR / RUN_NAME
best_pt   = run_dir / "weights" / "best.pt"
last_pt   = run_dir / "weights" / "last.pt"

if not best_pt.exists():
    print(f"[WARN] best.pt not found at {best_pt}; falling back to last.pt")
    best_pt = last_pt

print(f"\n  Best weights : {best_pt}")


# ═══════════════════════════════════════════════════════════════════════════════
#  5. EXPORT
#     5a. Keep the native PyTorch .pt  (already saved by trainer)
#     5b. Export to ONNX  — fastest CPU inference runtime (OpenCV, ONNX Runtime)
# ═══════════════════════════════════════════════════════════════════════════════

print("\n── Exporting Model ──────────────────────────────────────────────────────")

# --- 5a: Copy best.pt to a clearly-named artefact ----------------------------
pt_export = run_dir / "dental_yolo11n_best.pt"
shutil.copy2(best_pt, pt_export)
print(f"  [✓] PyTorch export  : {pt_export}")

# --- 5b: ONNX export ----------------------------------------------------------
# opset=12 gives broadest runtime compatibility (ONNX Runtime ≥ 1.8)
# dynamic=True allows variable batch sizes at inference time
export_model = YOLO(str(best_pt))

onnx_path = export_model.export(
    format  = "onnx",
    imgsz   = 224,
    opset   = 12,
    dynamic = True,
    simplify= True,   # graph simplification → faster CPU inference
)
print(f"  [✓] ONNX export     : {onnx_path}")


# ═══════════════════════════════════════════════════════════════════════════════
#  6. TRAINING CURVE ANALYSIS
#     Reads results.csv written by Ultralytics and plots:
#       • Top-1 Accuracy  (train & val)
#       • Top-5 Accuracy  (train & val)
#       • Train Loss
#       • Val Loss
# ═══════════════════════════════════════════════════════════════════════════════

print("\n── Plotting Training Curves ─────────────────────────────────────────────")

csv_path = run_dir / "results.csv"

if not csv_path.exists():
    print(f"  [WARN] results.csv not found at {csv_path}. Skipping plots.")
else:
    df = pd.read_csv(csv_path)
    # Strip leading/trailing whitespace from column names (Ultralytics quirk)
    df.columns = df.columns.str.strip()

    print(f"  Columns available: {list(df.columns)}")

    epochs_range = df["epoch"] if "epoch" in df.columns else range(len(df))

    # ── Helper: safely retrieve a column or None ──────────────────────────────
    def col(name):
        return df[name] if name in df.columns else None

    # ── Build figure ──────────────────────────────────────────────────────────
    fig = plt.figure(figsize=(16, 10), facecolor="#0d1117")
    gs  = gridspec.GridSpec(2, 2, figure=fig, hspace=0.45, wspace=0.35)

    COLORS = {
        "train" : "#58a6ff",   # blue
        "val"   : "#f97316",   # orange
        "grid"  : "#21262d",
        "text"  : "#c9d1d9",
        "title" : "#ffffff",
    }

    def styled_ax(ax, title, ylabel):
        ax.set_facecolor("#161b22")
        ax.set_title(title, color=COLORS["title"], fontsize=13, fontweight="bold", pad=10)
        ax.set_xlabel("Epoch", color=COLORS["text"], fontsize=10)
        ax.set_ylabel(ylabel, color=COLORS["text"], fontsize=10)
        ax.tick_params(colors=COLORS["text"])
        ax.grid(True, color=COLORS["grid"], linewidth=0.8, linestyle="--")
        for spine in ax.spines.values():
            spine.set_edgecolor(COLORS["grid"])
        ax.legend(facecolor="#21262d", edgecolor=COLORS["grid"],
                  labelcolor=COLORS["text"], fontsize=9)

    # ── Plot 1 : Top-1 Accuracy ───────────────────────────────────────────────
    ax1 = fig.add_subplot(gs[0, 0])
    t1  = col("train/top1_acc") or col("metrics/accuracy_top1")
    v1  = col("val/top1_acc")   or col("val/accuracy_top1")
    if t1 is not None:
        ax1.plot(epochs_range, t1, color=COLORS["train"], lw=2, label="Train Top-1")
    if v1 is not None:
        ax1.plot(epochs_range, v1, color=COLORS["val"],   lw=2, label="Val Top-1",
                 linestyle="--")
    styled_ax(ax1, "Top-1 Accuracy", "Accuracy")

    # ── Plot 2 : Top-5 Accuracy ───────────────────────────────────────────────
    ax2 = fig.add_subplot(gs[0, 1])
    t5  = col("train/top5_acc") or col("metrics/accuracy_top5")
    v5  = col("val/top5_acc")   or col("val/accuracy_top5")
    if t5 is not None:
        ax2.plot(epochs_range, t5, color=COLORS["train"], lw=2, label="Train Top-5")
    if v5 is not None:
        ax2.plot(epochs_range, v5, color=COLORS["val"],   lw=2, label="Val Top-5",
                 linestyle="--")
    styled_ax(ax2, "Top-5 Accuracy", "Accuracy")

    # ── Plot 3 : Training Loss ────────────────────────────────────────────────
    ax3 = fig.add_subplot(gs[1, 0])
    tl  = col("train/loss") or col("train/cls_loss")
    if tl is not None:
        ax3.plot(epochs_range, tl, color=COLORS["train"], lw=2, label="Train Loss")
    styled_ax(ax3, "Training Loss", "Loss")

    # ── Plot 4 : Validation Loss ──────────────────────────────────────────────
    ax4 = fig.add_subplot(gs[1, 1])
    vl  = col("val/loss") or col("val/cls_loss")
    if vl is not None:
        ax4.plot(epochs_range, vl, color=COLORS["val"], lw=2,
                 linestyle="--", label="Val Loss")
    styled_ax(ax4, "Validation Loss", "Loss")

    # ── Super-title ────────────────────────────────────────────────────────────
    fig.suptitle(
        "YOLO11n  ·  Dental X-Ray Classifier  ·  Training Curves",
        color=COLORS["title"], fontsize=15, fontweight="bold", y=1.01,
    )

    plot_path = run_dir / "training_curves.png"
    plt.savefig(plot_path, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    print(f"  [✓] Curves saved    : {plot_path}")


# ═══════════════════════════════════════════════════════════════════════════════
#  7. SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

print("\n" + "═" * 72)
print("  TRAINING COMPLETE — ARTEFACT SUMMARY")
print("═" * 72)
print(f"  Run directory    :  {run_dir}")
print(f"  Best weights     :  {pt_export}")
print(f"  ONNX model       :  {onnx_path}")
if csv_path.exists():
    print(f"  Training curves  :  {run_dir / 'training_curves.png'}")
print(f"  Total time       :  {elapsed / 60:.1f} min")
print("═" * 72)
print()
print("  NEXT STEPS:")
print("  1. Evaluate on held-out test data:")
print("       model = YOLO('dental_yolo11n_best.pt')")
print("       metrics = model.val(data='<test_dir>', device='cpu')")
print()
print("  2. Run inference on a single X-ray:")
print("       results = model.predict('image.jpg', device='cpu')")
print("       print(results[0].probs.top1)   # predicted class index")
print()
print("  3. Deploy ONNX with ONNX Runtime (fastest CPU inference):")
print("       import onnxruntime as ort")
print("       sess = ort.InferenceSession('dental_yolo11n_best.onnx')")
print("═" * 72 + "\n")
