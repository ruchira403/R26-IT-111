"""
Preprocessing Module
--------------------
Prepares dental X-ray images for analysis:
  - Resize to standard size
  - Normalize brightness
  - Reduce noise
  - Enhance contrast
"""

import cv2
import numpy as np


def preprocess_image(image_path, target_size=(512, 512)):
    """
    Apply preprocessing pipeline to a dental X-ray image.

    Args:
        image_path (str): path to the X-ray image
        target_size (tuple): output size

    Returns:
        numpy.ndarray: preprocessed grayscale image
    """
    # Load image as grayscale
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if image is None:
        raise FileNotFoundError(f"Cannot read image: {image_path}")

    # Resize
    image = cv2.resize(image, target_size, interpolation=cv2.INTER_AREA)

    # Normalize brightness to [0-255]
    image = cv2.normalize(image, None, 0, 255, cv2.NORM_MINMAX)
    image = image.astype(np.uint8)

    # Reduce noise (Non-Local Means denoising)
    image = cv2.fastNlMeansDenoising(image, None, h=10)

    # Enhance contrast using CLAHE
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    image = clahe.apply(image)

    return image
