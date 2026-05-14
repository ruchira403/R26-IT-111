"""
Dental Health Parameters
------------------------
Implementation of the 6 parameters used by Member 3 module:
  1. Tooth Alignment Symmetry
  2. Bone Density Index
  3. Periodontal Bone Level
  4. Caries Progression Index
  5. Tooth Spacing
  6. Tooth Size Proportion
"""

import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim


# Pixel-to-mm conversion (approximate for 512px panoramic X-ray)
PIXELS_PER_MM = 8.0


# =============================================================
# PARAMETER 1: Tooth Alignment Symmetry (0-100)
# =============================================================
def tooth_alignment_symmetry(image, features):
    """Measures left vs right balance of the dental arch using SSIM."""
    h, w = image.shape
    mid = w // 2
    left = image[:, :mid]
    right = cv2.flip(image[:, mid:], 1)

    min_w = min(left.shape[1], right.shape[1])
    left = left[:, :min_w]
    right = right[:, :min_w]

    score, _ = ssim(left, right, full=True)
    return round(max(0, score) * 100, 2)


# =============================================================
# PARAMETER 2: Bone Density Index (0-1)
# =============================================================
def bone_density_index(image, features):
    """Measures alveolar bone density from grayscale intensity."""
    bone_mask = features["bone_mask"]
    bone_pixels = image[bone_mask > 0]

    mean_intensity = float(np.mean(bone_pixels))
    std_intensity = float(np.std(bone_pixels))

    intensity_score = np.clip((mean_intensity - 50) / 150.0, 0, 1)
    uniformity = np.clip(1 - (std_intensity / 100.0), 0, 1)

    bdi = 0.7 * intensity_score + 0.3 * uniformity
    return round(float(bdi), 3)


# =============================================================
# PARAMETER 3: Periodontal Bone Level (mm)
# =============================================================
def periodontal_bone_level(image, features):
    """Estimates distance from tooth crown to alveolar crest in mm."""
    edges = cv2.Canny(image, 50, 150)
    h, w = image.shape

    tooth_top = []
    bone_top = []
    bone_mask = features["bone_mask"]

    for col in range(int(w*0.15), int(w*0.85), 5):
        # Top edge of teeth
        col_edges = np.where(edges[:, col] > 0)[0]
        if len(col_edges) > 0:
            tooth_top.append(col_edges[0])
        # Top of bone region
        bone_col = np.where(bone_mask[:, col] > 0)[0]
        if len(bone_col) > 0:
            bone_top.append(bone_col[0])

    if not tooth_top or not bone_top:
        return 1.0

    distance_px = max(0, np.median(bone_top) - np.median(tooth_top))
    distance_mm = round(float(distance_px / PIXELS_PER_MM), 2)
    return max(0.5, min(distance_mm, 10.0))


# =============================================================
# PARAMETER 4: Caries Progression Index (0-100, lower better)
# =============================================================
def caries_progression_index(image, features):
    """Measures count and size of dark lesion spots."""
    lesions = features["lesion_contours"]
    h, w = image.shape

    count = len(lesions)
    total_area = sum(cv2.contourArea(c) for c in lesions)
    max_area = max((cv2.contourArea(c) for c in lesions), default=0)

    count_part = min(count / 15.0, 1.0) * 40
    area_part = min(total_area / (h*w) * 500, 1.0) * 40
    max_part = min(max_area / 1500.0, 1.0) * 20

    return round(float(count_part + area_part + max_part), 2)


# =============================================================
# PARAMETER 5: Tooth Spacing (0-100)
# =============================================================
def tooth_spacing(features):
    """Analyzes gaps between adjacent teeth."""
    bboxes = sorted(features["tooth_bboxes"], key=lambda b: b[0])
    if len(bboxes) < 3:
        return 70.0

    gaps = []
    for i in range(len(bboxes) - 1):
        x1, _, w1, _ = bboxes[i]
        x2, _, _,  _ = bboxes[i + 1]
        gap = x2 - (x1 + w1)
        if -10 < gap < 100:
            gaps.append(gap)

    if not gaps:
        return 70.0

    mean_gap = float(np.mean(gaps))
    std_gap = float(np.std(gaps))

    consistency = max(0, 1 - (std_gap / 30.0))
    quality = max(0, 1 - abs(mean_gap - 5) / 30.0)

    return round((0.5 * consistency + 0.5 * quality) * 100, 2)


# =============================================================
# PARAMETER 6: Tooth Size Proportion (0-100)
# =============================================================
def tooth_size_proportion(features):
    """Compares left-side vs right-side tooth area totals."""
    bboxes = features["tooth_bboxes"]
    if len(bboxes) < 2:
        return 70.0

    # Get image midline (approx from bbox centers)
    xs = [x + w/2 for x, _, w, _ in bboxes]
    mid = (max(xs) + min(xs)) / 2

    left_area = sum(w * h for x, y, w, h in bboxes if (x + w/2) < mid)
    right_area = sum(w * h for x, y, w, h in bboxes if (x + w/2) >= mid)

    if left_area == 0 or right_area == 0:
        return 55.0

    ratio = min(left_area, right_area) / max(left_area, right_area)
    return round(float(ratio * 100), 2)
