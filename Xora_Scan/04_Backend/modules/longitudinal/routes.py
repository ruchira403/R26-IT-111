from flask import Blueprint, current_app, jsonify, request

from .config import MAX_TIMELINE_SCANS, RESEARCH_DISCLAIMER
from .longitudinal_service import analyze_pair, analyze_timeline

ruchira_blueprint = Blueprint("ruchira", __name__, url_prefix="/ruchira")


def _base_url():
    return request.host_url.rstrip("/")


@ruchira_blueprint.get("/health")
def health():
    return jsonify({
        "status": "Running",
        "member": "Member 03 - Longitudinal Panoramic X-ray Comparison",
        "research_disclaimer": RESEARCH_DISCLAIMER,
    })


@ruchira_blueprint.post("/compare")
def compare():
    payload = request.get_json(silent=True) or {}
    if not (payload.get("previous_image") or payload.get("previous_image_path")):
        return jsonify({"status": "Error", "message": "Previous scan image is required."}), 400
    if not (payload.get("current_image") or payload.get("current_image_path")):
        return jsonify({"status": "Error", "message": "Current scan image is required."}), 400

    try:
        result = analyze_pair(payload, current_app.config["UPLOAD_FOLDER"], _base_url())
        return jsonify(result), 200
    except ValueError as error:
        return jsonify({"status": "Error", "message": str(error)}), 422
    except Exception as error:
        current_app.logger.exception("Longitudinal comparison failed")
        return jsonify({
            "status": "Error",
            "message": "Longitudinal comparison could not be completed.",
            "details": str(error),
        }), 500


@ruchira_blueprint.post("/timeline")
def timeline():
    payload = request.get_json(silent=True) or {}
    scans = payload.get("scans") or []
    if not isinstance(scans, list) or not scans:
        return jsonify({"status": "Error", "message": "At least one scan is required."}), 400
    scans = scans[-MAX_TIMELINE_SCANS:]

    try:
        series = analyze_timeline(scans, current_app.config["UPLOAD_FOLDER"], _base_url())
        return jsonify({
            "status": "Success",
            "research_disclaimer": RESEARCH_DISCLAIMER,
            "series": series,
        }), 200
    except ValueError as error:
        return jsonify({"status": "Error", "message": str(error)}), 422
    except Exception as error:
        current_app.logger.exception("Longitudinal timeline failed")
        return jsonify({
            "status": "Error",
            "message": "Longitudinal timeline could not be completed.",
            "details": str(error),
        }), 500
