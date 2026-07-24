import os
import cv2
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Import main pipeline modules from the 'modules' folder
from modules.app import run_image_validation_pipeline
from modules.predict_with_levels import run_caries_detection

app = Flask(__name__)
CORS(app)

# Upload Folder 
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "status": "Running",
        "message": "Xora_Scan Multi-Member Core Hybrid Backend Active."
    })

@app.route('/validate', methods=['POST'])
def master_pipeline():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    file = request.files['image']
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)

    # 1. Read the original image using OpenCV
    img_cv2 = cv2.imread(file_path)
    if img_cv2 is None:
        return jsonify({"error": "Invalid image file"}), 400

    # STEP 1: RUN MEMBER 01 - IMAGE VALIDATION & ORIENTATION PIPELINE
    val_report, fixed_img = run_image_validation_pipeline(img_cv2)

    # If image is rejected, stop caries detection and send response immediately
    if val_report["status"] == "Rejected":
        return jsonify({
            "validation_results": val_report,
            "caries_results": {
                "status": "Skipped",
                "reason": f"Caries detection skipped because validation failed: {val_report.get('reason', 'Low Quality')}"
            },
            "message": "Process halted due to validation failure."
        }), 200

    # STEP 2: RUN MEMBER 02 - CARIES DETECTION PIPELINE (True Success Only)

    caries_report = run_caries_detection(fixed_img)

    #  Save the final processed image for display on the frontend
    fixed_filename = "fixed_" + file.filename
    fixed_image_path = os.path.join(app.config['UPLOAD_FOLDER'], fixed_filename)
    cv2.imwrite(fixed_image_path, fixed_img)

    # STEP 3: COMBINED SUCCESS RESPONSE
    return jsonify({
        "status": "Success",
        "fixed_image_url": f"http://127.0.0.1:5000/uploads/{fixed_filename}",
        "validation_results": val_report,
        "caries_results": caries_report,
        "message": "Image successfully validated, corrected, and analyzed for caries."
    }), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)