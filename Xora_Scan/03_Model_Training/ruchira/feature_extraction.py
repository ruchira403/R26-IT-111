"""
Feature Extraction Module
-------------------------
Extracts key dental structures from preprocessed X-rays:
  - Tooth bounding boxes
  - Bone region mask
  - Possible lesion areas
"""

import cv2
import numpy as np


def extract_features(image):
    """
    Extract dental features from a preprocessed X-ray.

    Args:
        image (numpy.ndarray): preprocessed grayscale image

    Returns:
        dict: tooth bboxes, bone mask, lesion contours
    """
    h, w = image.shape

    # 1. Tooth detection using Otsu thresholding
    _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    tooth_bboxes = []
    for c in contours:
        area = cv2.contourArea(c)
        if 200 < area < 50000:
            x, y, bw, bh = cv2.boundingRect(c)
            tooth_bboxes.append((x, y, bw, bh))

    # 2. Bone region mask (middle-lower area)
    bone_mask = np.zeros_like(image)
    bone_mask[int(h*0.35):int(h*0.95), int(w*0.10):int(w*0.90)] = 255

    # 3. Lesion detection (dark spots)
    inverted = 255 - image
    adaptive = cv2.adaptiveThreshold(
        inverted, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 21, -5
    )
    lesion_contours, _ = cv2.findContours(
        adaptive, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    lesion_contours = [c for c in lesion_contours if 20 < cv2.contourArea(c) < 2000]

    return {
        "tooth_bboxes":    tooth_bboxes,
        "bone_mask":       bone_mask,
        "lesion_contours": lesion_contours,
    }
