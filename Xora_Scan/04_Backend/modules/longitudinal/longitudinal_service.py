from .config import PARAMETER_LABELS, PARAMETER_WEIGHTS, RESEARCH_DISCLAIMER, TREND_THRESHOLD
from .heatmap import create_change_heatmap
from .image_loader import load_image, resize_for_analysis
from .metrics import (
    blend_current_scores,
    calculate_dhs,
    compute_change_percentage,
    grade_for_score,
    intrinsic_scores,
    pair_similarity_scores,
    scan_interval_days,
)
from .registration import register_images


def _trend(delta):
    if delta > TREND_THRESHOLD:
        return "improving"
    if delta < -TREND_THRESHOLD:
        return "declining"
    return "stable"


def _parameter_payload(previous_scores, current_scores):
    items = []
    for key, weight in PARAMETER_WEIGHTS.items():
        delta = round(float(current_scores[key]) - float(previous_scores[key]), 2)
        items.append({
            "key": key,
            "label": PARAMETER_LABELS[key],
            "weight": int(weight * 100),
            "previous": round(float(previous_scores[key]), 2),
            "current": round(float(current_scores[key]), 2),
            "delta": delta,
            "trend": _trend(delta),
        })
    return items


def _dominant_changes(parameters):
    ranked = sorted(parameters, key=lambda item: abs(item["delta"]), reverse=True)
    return [
        {
            "key": item["key"],
            "label": item["label"],
            "delta": item["delta"],
            "trend": item["trend"],
        }
        for item in ranked[:3]
    ]


def _build_summary(delta, trend, change_percentage):
    direction = {
        "improving": "increased",
        "declining": "decreased",
        "stable": "remained broadly stable",
    }[trend]
    if trend == "stable":
        return (
            f"The longitudinal dental-health proxy {direction} between the selected scans "
            f"({abs(delta):.2f}-point difference; {change_percentage:.2f}% image-change area)."
        )
    return (
        f"The longitudinal dental-health proxy {direction} by {abs(delta):.2f} points between "
        f"the selected scans, with {change_percentage:.2f}% of registered pixels showing notable change."
    )


def analyze_pair(payload, upload_folder, base_url):
    previous_source = payload.get("previous_image") or payload.get("previous_image_path")
    current_source = payload.get("current_image") or payload.get("current_image_path")

    previous_image = resize_for_analysis(load_image(previous_source, upload_folder))
    current_image = resize_for_analysis(load_image(current_source, upload_folder))

    previous_diseases = payload.get("previous_diseases") or []
    current_diseases = payload.get("current_diseases") or []

    aligned_previous, registration = register_images(previous_image, current_image)
    previous_scores = intrinsic_scores(previous_image, previous_diseases)
    current_intrinsic = intrinsic_scores(current_image, current_diseases)
    pair_scores = pair_similarity_scores(aligned_previous, current_image, registration)
    current_scores = blend_current_scores(current_intrinsic, pair_scores)

    previous_dhs = calculate_dhs(previous_scores)
    current_dhs = calculate_dhs(current_scores)
    delta = round(current_dhs - previous_dhs, 2)
    trend = _trend(delta)

    change_percentage, diff_gray = compute_change_percentage(aligned_previous, current_image)
    heatmap_filename = create_change_heatmap(diff_gray, current_image, upload_folder)
    heatmap_url = f"{base_url.rstrip('/')}/uploads/{heatmap_filename}"

    parameters = _parameter_payload(previous_scores, current_scores)
    interval_days = scan_interval_days(payload.get("previous_date"), payload.get("current_date"))

    return {
        "status": "Success",
        "research_disclaimer": RESEARCH_DISCLAIMER,
        "previous": {
            "scan_id": payload.get("previous_scan_id"),
            "date": payload.get("previous_date"),
            "dhs": previous_dhs,
            "grade": grade_for_score(previous_dhs),
            "parameters": previous_scores,
        },
        "current": {
            "scan_id": payload.get("current_scan_id"),
            "date": payload.get("current_date"),
            "dhs": current_dhs,
            "grade": grade_for_score(current_dhs),
            "parameters": current_scores,
        },
        "comparison": {
            "delta": delta,
            "trend": trend,
            "change_percentage": change_percentage,
            "scan_interval_days": interval_days,
            "registration": registration,
            "parameters": parameters,
            "dominant_changes": _dominant_changes(parameters),
            "summary": _build_summary(delta, trend, change_percentage),
        },
        "heatmap_url": heatmap_url,
    }


def analyze_timeline(scans, upload_folder, base_url):
    if not scans:
        return []

    ordered = sorted(scans, key=lambda item: str(item.get("created_at") or item.get("date") or ""))
    loaded = []
    for scan in ordered:
        source = scan.get("image_path") or scan.get("image")
        image = resize_for_analysis(load_image(source, upload_folder))
        loaded.append((scan, image))

    first_scan, first_image = loaded[0]
    first_scores = intrinsic_scores(first_image, first_scan.get("detected_diseases") or first_scan.get("diseases") or [])
    first_dhs = calculate_dhs(first_scores)
    series = [{
        "scan_id": first_scan.get("id"),
        "date": first_scan.get("created_at") or first_scan.get("date"),
        "dhs": first_dhs,
        "grade": grade_for_score(first_dhs),
        "delta": None,
        "trend": "baseline",
    }]

    for index in range(1, len(loaded)):
        prev_scan, prev_image = loaded[index - 1]
        curr_scan, curr_image = loaded[index]
        aligned_previous, registration = register_images(prev_image, curr_image)
        curr_intrinsic = intrinsic_scores(
            curr_image,
            curr_scan.get("detected_diseases") or curr_scan.get("diseases") or [],
        )
        pair_scores = pair_similarity_scores(aligned_previous, curr_image, registration)
        curr_scores = blend_current_scores(curr_intrinsic, pair_scores)
        curr_dhs = calculate_dhs(curr_scores)
        previous_timeline_dhs = series[-1]["dhs"]
        delta = round(curr_dhs - previous_timeline_dhs, 2)
        series.append({
            "scan_id": curr_scan.get("id"),
            "date": curr_scan.get("created_at") or curr_scan.get("date"),
            "dhs": curr_dhs,
            "grade": grade_for_score(curr_dhs),
            "delta": delta,
            "trend": _trend(delta),
        })

    return series
