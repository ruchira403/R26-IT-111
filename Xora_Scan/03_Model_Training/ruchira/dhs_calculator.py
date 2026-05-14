"""
Dental Health Score (DHS) Calculator
-------------------------------------
Combines all 6 parameters into a single composite score (0-100)
with a letter grade (A-E).

⭐ This is the KEY NOVELTY of the Member 3 module.
"""


# Weights for each parameter (sum must equal 1.0)
WEIGHTS = {
    "tooth_alignment_symmetry": 0.15,
    "bone_density_index":       0.25,
    "periodontal_bone_level":   0.20,
    "caries_progression_index": 0.20,
    "tooth_spacing":            0.10,
    "tooth_size_proportion":    0.10,
}


def normalize(name, value):
    """Convert each parameter value to a common 0-100 health scale."""
    if name == "bone_density_index":
        # 0-1 scale, higher better
        return min(max(value * 100, 0), 100)
    if name == "periodontal_bone_level":
        # mm value, lower better. 0mm=100, 6mm+=0
        return max(0, min(100, (6.0 - value) / 6.0 * 100))
    if name == "caries_progression_index":
        # 0-100 lower better, so invert
        return max(0, 100 - value)
    # Default: 0-100, higher better
    return max(0, min(100, value))


def get_grade(score):
    """Convert numeric score to letter grade A-E."""
    if score >= 85:
        return "A", "Excellent"
    if score >= 75:
        return "B", "Good"
    if score >= 65:
        return "C", "Fair"
    if score >= 50:
        return "D", "Needs Attention"
    return "E", "Critical"


def calculate_dhs(parameters):
    """
    Compute the overall Dental Health Score from the 6 parameters.

    Args:
        parameters (dict): values for each of the 6 parameters

    Returns:
        dict: { score, grade, status }
    """
    total = 0.0
    for name, value in parameters.items():
        normalized = normalize(name, value)
        weight = WEIGHTS.get(name, 0)
        total += normalized * weight

    score = round(total, 2)
    grade, status = get_grade(score)

    return {
        "score":  score,
        "grade":  grade,
        "status": status,
    }
