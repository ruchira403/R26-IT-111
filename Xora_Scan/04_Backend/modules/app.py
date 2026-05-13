from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import tensorflow as tf
import cv2
import numpy as np
import os
from tensorflow.keras.utils import load_img, img_to_array
from tensorflow.keras.applications.efficientnet import preprocess_input

app = Flask(__name__)
CORS(app) 

# --- 1. LOAD THE TRAINED MODEL ---
MODEL_PATH = '../02_Model_Training/outputs_v4/dental_validation_model_v4.keras'
model = tf.keras.models.load_model(MODEL_PATH)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

CLASS_NAMES = ['0_Correct', '1_Rotate_90', '2_Rotate_180', '3_Rotate_270', '4_Non_Dental']

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/', methods=['GET'])
def home():
    return jsonify({"status": "Backend is running", "message": "Dental Validator V4 Active "})

# --- 2. QUALITY CHECK LOGIC WITH DETAILED SCORE & REASONS ---
def calculate_quality_metrics(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Exposure Check
    avg_brightness = np.mean(gray)
    exposure = "Good"
    if avg_brightness < 40: exposure = "Under-exposed"
    elif avg_brightness > 230: exposure = "Over-exposed"
    
    # Blur Check (Laplacian Variance)
    blur_val = cv2.Laplacian(gray, cv2.CV_64F).var()
    is_blurred = blur_val < 65 
    
    # Quality Score Calculation
    # Blur Score (Max normalized to 200)
    blur_score_norm = min(100, (blur_val / 200.0) * 100)
    # Brightness Score 
    brightness_score = 100 - abs(127 - avg_brightness) * (100 / 127)
    
    # Final Weight: Blur (70%) + Brightness (30%)
    final_score = (blur_score_norm * 0.7) + (brightness_score * 0.3)
    
    return exposure, is_blurred, round(blur_val, 2), round(final_score, 2)

# --- 3. MAIN VALIDATION ROUTE ---
@app.route('/validate', methods=['POST'])
def validate_xray():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    file = request.files['image']
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    img_cv2 = cv2.imread(file_path)
    if img_cv2 is None:
        return jsonify({"error": "Invalid image file"}), 400

    # STEP 1: AI Prediction (Content Check)
    img_keras = load_img(file_path, target_size=(224, 224))
    img_array = img_to_array(img_keras)
    img_preprocessed = preprocess_input(img_array)
    img_reshaped = np.expand_dims(img_preprocessed, axis=0)
    
    prediction = model.predict(img_reshaped)
    class_id = int(np.argmax(prediction)) 
    confidence = float(np.max(prediction))
    detected_label = CLASS_NAMES[class_id]

    if detected_label == '4_Non_Dental':
        return jsonify({
            "status": "Rejected",
            "reason": "Image is not a dental X-ray.",
            "confidence": round(confidence, 2),
            "label": detected_label
        }), 200

    # STEP 2: Quality Analysis (Score & Detailed Reasons)
    exposure, is_blurred, blur_val, quality_score = calculate_quality_metrics(img_cv2)

    if quality_score < 40:
        fail_reason = "Low image quality."
        if is_blurred: fail_reason += " Image is too blurry."
        if exposure != "Good": fail_reason += f" Lighting is {exposure}."

        return jsonify({
            "status": "Rejected",
            "reason": fail_reason,
            "quality_score": quality_score,
            "blur_score": blur_val,
            "exposure": exposure
        }), 200

    # STEP 3: Auto-Rotation Logic
    fixed_img = img_cv2.copy()
    rotation_note = "No rotation needed"

    # if class_id == 1:
    #     fixed_img = cv2.rotate(img_cv2, cv2.ROTATE_90_CLOCKWISE)
    #     rotation_note = "Rotated 90 degrees clockwise"
    # elif class_id == 2:
    #     fixed_img = cv2.rotate(img_cv2, cv2.ROTATE_180)
    #     rotation_note = "Rotated 180 degrees"
    # elif class_id == 3:
    #     fixed_img = cv2.rotate(img_cv2, cv2.ROTATE_90_COUNTERCLOCKWISE)
    #     rotation_note = "Rotated 270 degrees"
    # --- Step 3: Auto-Rotation Logic (Corrected for OPG images) ---
    fixed_img = img_cv2.copy()
    rotation_note = "No rotation needed"

    if class_id == 1:
        fixed_img = cv2.rotate(img_cv2, cv2.ROTATE_90_COUNTERCLOCKWISE)
        rotation_note = "Rotated to fix orientation (Method A)"
    elif class_id == 2:
        fixed_img = cv2.rotate(img_cv2, cv2.ROTATE_180)
        rotation_note = "Rotated 180 degrees to fix"
    elif class_id == 3:
        fixed_img = cv2.rotate(img_cv2, cv2.ROTATE_90_CLOCKWISE)
        rotation_note = "Rotated to fix orientation (Method B)"

    fixed_filename = "fixed_" + file.filename
    fixed_path = os.path.join(UPLOAD_FOLDER, fixed_filename)
    cv2.imwrite(fixed_path, fixed_img)

    # STEP 4: Success Response
    return jsonify({
        "status": "Success",
        "quality_score": quality_score,
        "blur_score": blur_val,
        "confidence": round(confidence, 2),
        "exposure": exposure,
        "fixed_image_url": f"http://127.0.0.1:5000/uploads/{fixed_filename}",
        "is_blurred": bool(is_blurred),
        "orientation_detected": class_id,
        "rotation_applied": rotation_note,
        "message": "Image validated and corrected successfully."
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)