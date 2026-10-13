import os
from urllib.parse import urlparse, unquote
from urllib.request import Request, urlopen

import cv2
import numpy as np

from .config import MAX_ANALYSIS_WIDTH


def _decode_bytes(raw: bytes):
    arr = np.frombuffer(raw, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Unable to decode the dental image.")
    return image


def _candidate_local_paths(source: str, upload_folder: str):
    source = unquote(source.strip())
    candidates = []

    if os.path.isabs(source):
        candidates.append(source)

    normalized = source.replace("\\", "/")
    if normalized.startswith("/uploads/"):
        candidates.append(os.path.join(upload_folder, os.path.basename(normalized)))
    elif normalized.startswith("uploads/"):
        candidates.append(os.path.join(upload_folder, os.path.basename(normalized)))

    parsed = urlparse(source)
    if parsed.scheme in {"http", "https"} and parsed.path.startswith("/uploads/"):
        # Existing XoraScan scan rows commonly point to this Flask service.
        candidates.append(os.path.join(upload_folder, os.path.basename(parsed.path)))

    return candidates


def load_image(source: str, upload_folder: str):
    if not isinstance(source, str) or not source.strip():
        raise ValueError("A valid image path or URL is required.")

    for candidate in _candidate_local_paths(source, upload_folder):
        if os.path.isfile(candidate):
            image = cv2.imread(candidate, cv2.IMREAD_COLOR)
            if image is not None:
                return image

    parsed = urlparse(source)
    if parsed.scheme in {"http", "https"}:
        request = Request(source, headers={"User-Agent": "XoraScan-Longitudinal/1.0"})
        with urlopen(request, timeout=15) as response:
            raw = response.read(25 * 1024 * 1024 + 1)
        if len(raw) > 25 * 1024 * 1024:
            raise ValueError("Image is too large for longitudinal analysis.")
        return _decode_bytes(raw)

    if os.path.isfile(source):
        image = cv2.imread(source, cv2.IMREAD_COLOR)
        if image is not None:
            return image

    raise ValueError("The dental image could not be found from the saved scan path.")


def resize_for_analysis(image):
    h, w = image.shape[:2]
    if w <= MAX_ANALYSIS_WIDTH:
        return image.copy()

    scale = MAX_ANALYSIS_WIDTH / float(w)
    resized = cv2.resize(image, (MAX_ANALYSIS_WIDTH, max(1, int(h * scale))), interpolation=cv2.INTER_AREA)
    return resized


def to_gray(image):
    if image.ndim == 2:
        gray = image
    else:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return cv2.GaussianBlur(gray, (3, 3), 0)
