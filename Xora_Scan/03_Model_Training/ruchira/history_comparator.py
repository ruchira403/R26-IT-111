"""
=================================================================
  Member 3 - History Comparator Module
  Author: Bandaranayaka B.M.R.L (IT22278630)
  Project: R26-IT-111 (Comparative Dental Progress Tracking)
=================================================================

This module compares a previous and current dental X-ray and
analyzes structural changes between them.

Main entry point for the Member 3 component.
"""

import cv2
import numpy as np
from preprocessing import preprocess_image
from feature_extraction import extract_features
from parameters import (
    tooth_alignment_symmetry,
    bone_density_index,
    periodontal_bone_level,
    caries_progression_index,
    tooth_spacing,
    tooth_size_proportion,
)
from dhs_calculator import calculate_dhs


def analyze_xray(image_path):
    """
    Analyze a single dental X-ray and compute all 6 parameters + DHS.

    Args:
        image_path (str): path to the X-ray image file

    Returns:
        dict: contains all parameter values and overall DHS
    """
    # Step 1: Preprocess the image
    image = preprocess_image(image_path)

    # Step 2: Extract dental features
    features = extract_features(image)

    # Step 3: Compute the 6 parameters
    parameters = {
        "tooth_alignment_symmetry": tooth_alignment_symmetry(image, features),
        "bone_density_index":       bone_density_index(image, features),
        "periodontal_bone_level":   periodontal_bone_level(image, features),
        "caries_progression_index": caries_progression_index(image, features),
        "tooth_spacing":            tooth_spacing(features),
        "tooth_size_proportion":    tooth_size_proportion(features),
    }

    # Step 4: Compute composite DHS score
    dhs = calculate_dhs(parameters)

    return {
        "parameters": parameters,
        "dhs": dhs,
    }


def compare_xrays(previous_path, current_path):
    """
    Compare two dental X-rays (previous vs current) to track progression.

    Args:
        previous_path (str): path to previous X-ray
        current_path  (str): path to current X-ray

    Returns:
        dict: contains both analyses and trend information
    """
    previous_result = analyze_xray(previous_path)
    current_result  = analyze_xray(current_path)

    # Compute trend
    delta = current_result["dhs"]["score"] - previous_result["dhs"]["score"]
    if delta > 3:
        trend = "improving"
    elif delta < -3:
        trend = "declining"
    else:
        trend = "stable"

    return {
        "previous": previous_result,
        "current":  current_result,
        "delta":    round(delta, 2),
        "trend":    trend,
    }


# Quick test (run directly)
if __name__ == "__main__":
    print("Member 3 - History Comparator Module")
    print("=" * 50)
    print("Use compare_xrays(prev, curr) to analyze X-rays.")
