import cv2
import numpy as np

from .image_loader import to_gray


def _resize_to_current(previous, current):
    h, w = current.shape[:2]
    if previous.shape[:2] == (h, w):
        return previous.copy()
    return cv2.resize(previous, (w, h), interpolation=cv2.INTER_AREA)


def register_images(previous, current):
    """Register previous panoramic X-ray onto the current image canvas."""
    previous = _resize_to_current(previous, current)
    prev_gray = to_gray(previous)
    curr_gray = to_gray(current)

    orb = cv2.ORB_create(nfeatures=3000, scaleFactor=1.2, nlevels=8)
    kp_prev, des_prev = orb.detectAndCompute(prev_gray, None)
    kp_curr, des_curr = orb.detectAndCompute(curr_gray, None)

    matches_count = 0
    inliers_count = 0
    inlier_ratio = 0.0

    if des_prev is not None and des_curr is not None and len(kp_prev) >= 8 and len(kp_curr) >= 8:
        matcher = cv2.BFMatcher(cv2.NORM_HAMMING)
        raw_matches = matcher.knnMatch(des_prev, des_curr, k=2)
        good = [m for m, n in raw_matches if m.distance < 0.75 * n.distance]
        matches_count = len(good)

        if len(good) >= 8:
            src_pts = np.float32([kp_prev[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
            dst_pts = np.float32([kp_curr[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
            homography, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 4.0)
            if homography is not None and mask is not None:
                inliers_count = int(mask.ravel().sum())
                inlier_ratio = inliers_count / max(1, matches_count)
                if inliers_count >= 6:
                    h, w = current.shape[:2]
                    aligned = cv2.warpPerspective(previous, homography, (w, h), flags=cv2.INTER_LINEAR)
                    return aligned, {
                        "method": "ORB_RANSAC",
                        "matches": matches_count,
                        "inliers": inliers_count,
                        "inlier_ratio": round(inlier_ratio, 4),
                    }

    # Robust fallback for images with very few keypoints: affine ECC registration.
    try:
        warp = np.eye(2, 3, dtype=np.float32)
        prev_norm = prev_gray.astype(np.float32) / 255.0
        curr_norm = curr_gray.astype(np.float32) / 255.0
        criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 80, 1e-5)
        correlation, warp = cv2.findTransformECC(curr_norm, prev_norm, warp, cv2.MOTION_AFFINE, criteria)
        h, w = current.shape[:2]
        aligned = cv2.warpAffine(
            previous,
            warp,
            (w, h),
            flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
            borderMode=cv2.BORDER_CONSTANT,
        )
        return aligned, {
            "method": "ECC_AFFINE",
            "matches": matches_count,
            "inliers": inliers_count,
            "inlier_ratio": round(float(max(0.0, min(1.0, correlation))), 4),
        }
    except cv2.error:
        return previous, {
            "method": "RESIZE_FALLBACK",
            "matches": matches_count,
            "inliers": inliers_count,
            "inlier_ratio": round(inlier_ratio, 4),
        }
