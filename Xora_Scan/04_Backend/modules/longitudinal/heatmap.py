import os
import uuid

import cv2
import numpy as np


def create_change_heatmap(diff_gray, current_image, upload_folder, prefix="ruchira"):
    diff = cv2.GaussianBlur(diff_gray, (0, 0), 2.2)
    low = float(np.percentile(diff, 45))
    high = float(np.percentile(diff, 98))
    if high <= low:
        high = low + 1.0
    normalized = np.clip((diff.astype(np.float32) - low) / (high - low), 0.0, 1.0)
    heat_u8 = (normalized * 255.0).astype(np.uint8)
    colored = cv2.applyColorMap(heat_u8, cv2.COLORMAP_TURBO)

    if colored.shape[:2] != current_image.shape[:2]:
        colored = cv2.resize(colored, (current_image.shape[1], current_image.shape[0]), interpolation=cv2.INTER_LINEAR)

    alpha = (normalized * 0.62).astype(np.float32)
    if alpha.shape != current_image.shape[:2]:
        alpha = cv2.resize(alpha, (current_image.shape[1], current_image.shape[0]), interpolation=cv2.INTER_LINEAR)
    alpha = alpha[..., None]

    base = current_image.astype(np.float32)
    overlay = colored.astype(np.float32)
    blended = np.clip(base * (1.0 - alpha) + overlay * alpha, 0, 255).astype(np.uint8)

    filename = f"{prefix}_change_{uuid.uuid4().hex[:12]}.png"
    output_path = os.path.join(upload_folder, filename)
    cv2.imwrite(output_path, blended)
    return filename
