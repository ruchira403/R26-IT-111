import math
import re

import cv2
import numpy as np

from .config import PARAMETER_WEIGHTS
from .image_loader import to_gray


def clamp(value, low=0.0, high=100.0):
    return float(max(low, min(high, value)))


def _resized_gray(image, width=640):
    gray = to_gray(image)
    h, w = gray.shape[:2]
    if w > width:
        scale = width / float(w)
        gray = cv2.resize(gray, (width, max(1, int(h * scale))), interpolation=cv2.INTER_AREA)
    return gray


def _normalized_gray(image, width=640):
    return cv2.equalizeHist(_resized_gray(image, width=width))


def _symmetry_score(gray):
    h, w = gray.shape
    half = w // 2
    if half < 20:
        return 70.0
    left = gray[:, :half]
    right = gray[:, w - half:]
    right = cv2.flip(right, 1)
    diff = cv2.absdiff(left, right)
    similarity = 100.0 * (1.0 - float(np.mean(diff)) / 255.0)
    return clamp(45.0 + 0.65 * similarity)


def _center_balance_score(gray):
    h, w = gray.shape
    edges = cv2.Canny(gray, 45, 130)
    moments = cv2.moments(edges)
    if moments["m00"] <= 0:
        return 70.0
    center_x = moments["m10"] / moments["m00"]
    offset = abs(center_x - (w / 2.0)) / max(1.0, w / 2.0)
    return clamp(100.0 - offset * 100.0)


def alignment_score(gray):
    return clamp(0.72 * _symmetry_score(gray) + 0.28 * _center_balance_score(gray))


def bone_density_score(gray):
    h, w = gray.shape
    roi = gray[int(h * 0.28):int(h * 0.84), int(w * 0.08):int(w * 0.92)]
    if roi.size == 0:
        return 70.0
    mean = float(np.mean(roi))
    std = float(np.std(roi))
    p10, p90 = np.percentile(roi, [10, 90])
    dynamic_range = float(p90 - p10)

    mean_component = clamp(100.0 - abs(mean - 132.0) * 0.42, 45.0, 100.0)
    texture_component = clamp(100.0 - abs(std - 54.0) * 0.8, 45.0, 100.0)
    range_component = clamp(55.0 + dynamic_range * 0.45, 45.0, 100.0)
    return clamp(0.38 * mean_component + 0.34 * texture_component + 0.28 * range_component)


def periodontal_structure_score(gray):
    h, w = gray.shape
    roi = gray[int(h * 0.50):int(h * 0.88), int(w * 0.08):int(w * 0.92)]
    if roi.size == 0:
        return 70.0
    edges = cv2.Canny(roi, 50, 140)
    density = float(np.mean(edges > 0))
    horizontal = cv2.Sobel(roi, cv2.CV_32F, 0, 1, ksize=3)
    continuity = float(np.mean(np.abs(horizontal)))
    density_score = clamp(100.0 - abs(density - 0.10) * 300.0, 48.0, 100.0)
    continuity_score = clamp(55.0 + continuity * 0.85, 48.0, 100.0)
    return clamp(0.55 * density_score + 0.45 * continuity_score)


def spacing_score(gray):
    h, w = gray.shape
    roi = gray[int(h * 0.30):int(h * 0.80), int(w * 0.06):int(w * 0.94)]
    if roi.size == 0:
        return 70.0
    grad_x = np.abs(cv2.Sobel(roi, cv2.CV_32F, 1, 0, ksize=3))
    projection = np.mean(grad_x, axis=0)
    if projection.size < 20 or float(np.max(projection)) <= 0:
        return 68.0
    threshold = float(np.mean(projection) + 0.65 * np.std(projection))
    candidates = np.where(projection > threshold)[0]
    if len(candidates) < 8:
        return 70.0

    # Collapse adjacent high-gradient columns into peaks.
    peaks = []
    start = candidates[0]
    last = candidates[0]
    for idx in candidates[1:]:
        if idx - last > 3:
            peaks.append((start + last) / 2.0)
            start = idx
        last = idx
    peaks.append((start + last) / 2.0)
    if len(peaks) < 6:
        return 72.0
    gaps = np.diff(peaks)
    gaps = gaps[(gaps > 3) & (gaps < w * 0.12)]
    if len(gaps) < 4:
        return 74.0
    cv = float(np.std(gaps) / max(1e-6, np.mean(gaps)))
    return clamp(100.0 - cv * 85.0, 52.0, 100.0)


def proportion_score(gray):
    h, w = gray.shape
    _, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    # Radiographs can have inverted-looking occupancy. Choose the less extreme foreground.
    ratio = float(np.mean(mask > 0))
    if ratio > 0.72:
        mask = cv2.bitwise_not(mask)
        ratio = float(np.mean(mask > 0))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return 68.0
    largest = max(contours, key=cv2.contourArea)
    x, y, bw, bh = cv2.boundingRect(largest)
    width_ratio = bw / max(1.0, w)
    height_ratio = bh / max(1.0, h)
    center = (x + bw / 2.0) / max(1.0, w)
    center_score = clamp(100.0 - abs(center - 0.5) * 150.0)
    width_score = clamp(100.0 - abs(width_ratio - 0.80) * 95.0, 45.0, 100.0)
    height_score = clamp(100.0 - abs(height_ratio - 0.68) * 85.0, 45.0, 100.0)
    return clamp(0.42 * center_score + 0.34 * width_score + 0.24 * height_score)


def _normalize_disease_name(value):
    return re.sub(r"[^a-z0-9]", "", str(value or "").lower())


def _severity_weight(value):
    normalized = str(value or "").strip().lower()
    if "3" in normalized or "severe" in normalized:
        return 3.0
    if "2" in normalized or "moderate" in normalized:
        return 2.0
    if "1" in normalized or "mild" in normalized:
        return 1.0
    return 1.25


def _confidence(value):
    try:
        confidence = float(value)
    except (TypeError, ValueError):
        return 1.0
    if confidence > 1.0:
        confidence /= 100.0
    return max(0.2, min(1.0, confidence))


def disease_penalties(diseases):
    caries_penalty = 0.0
    periodontal_penalty = 0.0
    for disease in diseases or []:
        name = _normalize_disease_name(
            disease.get("disease_type") or disease.get("type") or disease.get("label")
        )
        if not name or "nodisease" in name or "nondental" in name:
            continue
        weight = _severity_weight(
            disease.get("severity_level") or disease.get("severity") or disease.get("level")
        )
        confidence = _confidence(disease.get("confidence"))
        if "cavity" in name or "caries" in name or "dentalcatiy" in name:
            caries_penalty += {1.0: 8.0, 2.0: 18.0, 3.0: 30.0}.get(weight, 12.0) * confidence
        if "periodontal" in name or "boneloss" in name or "bone" in name:
            periodontal_penalty += {1.0: 10.0, 2.0: 22.0, 3.0: 35.0}.get(weight, 14.0) * confidence
    return min(55.0, caries_penalty), min(60.0, periodontal_penalty)


def intrinsic_scores(image, diseases=None):
    raw_gray = _resized_gray(image)
    gray = cv2.equalizeHist(raw_gray)
    caries_penalty, periodontal_penalty = disease_penalties(diseases)

    scores = {
        "alignment": alignment_score(gray),
        "bone_density": bone_density_score(raw_gray),
        "periodontal": periodontal_structure_score(gray) - periodontal_penalty,
        "caries": 96.0 - caries_penalty,
        "spacing": spacing_score(gray),
        "proportion": proportion_score(gray),
    }
    return {key: round(clamp(value), 2) for key, value in scores.items()}


def _roi_similarity(prev_gray, curr_gray, y1, y2, x1=0.06, x2=0.94):
    h, w = curr_gray.shape
    a = prev_gray[int(h * y1):int(h * y2), int(w * x1):int(w * x2)]
    b = curr_gray[int(h * y1):int(h * y2), int(w * x1):int(w * x2)]
    if a.size == 0 or b.size == 0:
        return 70.0
    diff = cv2.absdiff(a, b)
    return clamp(100.0 - float(np.mean(diff)) / 255.0 * 120.0, 35.0, 100.0)


def pair_similarity_scores(aligned_previous, current, registration):
    prev_gray = _normalized_gray(aligned_previous)
    curr_gray = _normalized_gray(current)
    if prev_gray.shape != curr_gray.shape:
        prev_gray = cv2.resize(prev_gray, (curr_gray.shape[1], curr_gray.shape[0]), interpolation=cv2.INTER_AREA)

    registration_score = clamp(48.0 + float(registration.get("inlier_ratio", 0.0)) * 52.0)
    if registration.get("method") == "ORB_RANSAC" and registration.get("inliers", 0) >= 12:
        registration_score = clamp(registration_score + 7.0)

    global_similarity = _roi_similarity(prev_gray, curr_gray, 0.08, 0.94, 0.03, 0.97)
    periodontal_similarity = _roi_similarity(prev_gray, curr_gray, 0.50, 0.88, 0.08, 0.92)
    density_similarity = _roi_similarity(prev_gray, curr_gray, 0.28, 0.84, 0.08, 0.92)

    prev_edges = cv2.Canny(prev_gray, 45, 130)
    curr_edges = cv2.Canny(curr_gray, 45, 130)
    edge_diff = np.mean(cv2.absdiff(prev_edges, curr_edges)) / 255.0
    edge_similarity = clamp(100.0 - edge_diff * 95.0, 35.0, 100.0)

    return {
        "alignment": round(clamp(0.65 * registration_score + 0.35 * global_similarity), 2),
        "bone_density": round(density_similarity, 2),
        "periodontal": round(periodontal_similarity, 2),
        "caries": round(clamp(0.55 * global_similarity + 0.45 * density_similarity), 2),
        "spacing": round(edge_similarity, 2),
        "proportion": round(clamp(0.60 * global_similarity + 0.40 * edge_similarity), 2),
    }


def blend_current_scores(current_intrinsic, pair_scores):
    # Intrinsic signal remains dominant; pair similarity contributes longitudinal context.
    return {
        key: round(clamp(current_intrinsic[key] * 0.78 + pair_scores[key] * 0.22), 2)
        for key in PARAMETER_WEIGHTS
    }


def calculate_dhs(scores):
    total = sum(float(scores[key]) * weight for key, weight in PARAMETER_WEIGHTS.items())
    return round(clamp(total), 2)


def grade_for_score(score):
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "E"


def compute_change_percentage(aligned_previous, current):
    prev_gray = to_gray(aligned_previous)
    curr_gray = to_gray(current)
    if prev_gray.shape != curr_gray.shape:
        prev_gray = cv2.resize(prev_gray, (curr_gray.shape[1], curr_gray.shape[0]), interpolation=cv2.INTER_AREA)
    diff = cv2.absdiff(prev_gray, curr_gray)
    threshold = max(14.0, float(np.percentile(diff, 72)))
    changed = diff > threshold
    return round(float(np.mean(changed)) * 100.0, 2), diff


def scan_interval_days(previous_date, current_date):
    if not previous_date or not current_date:
        return None
    try:
        from datetime import datetime
        prev = datetime.fromisoformat(str(previous_date).replace("Z", "+00:00"))
        curr = datetime.fromisoformat(str(current_date).replace("Z", "+00:00"))
        return max(0, int(round((curr - prev).total_seconds() / 86400.0)))
    except (ValueError, TypeError):
        return None
