AI-Based Intelligent Dental Diagnosis and Personalized Care System
Project ID: R26-IT-111  

Project Overview
This project introduces an intelligent ecosystem for dental healthcare, leveraging state-of-the-art Artificial Intelligence, Computer Vision, and Machine Learning. The system automates the diagnostic workflow—from validating X-ray quality to detecting diseases, tracking teeth alignment progression, and generating personalized preventive care plans.

---

Branching Strategy
To ensure organized integration, the project follows a structured Git workflow:
* `main`: Stable, production-ready release branch.
* `develop`: Integration branch where all modules are merged for testing.
* `Dev_nadun`: Harsha S.N. (X-ray Validation & Quality Control)
* `Dev_sahan`: Wijerathna U.H.S.U (Automated Disease Identification & YOLO11)
* `Dev_ruchira`: BANDARANAYAKE B M R L (Teeth Alignment & Progress Tracking)
* `Dev_apsara`: MADHUSHANI K.H.S.A (Risk Assessment & Personalized Care Planning)

---

Modules & Functionalities

1. Automated X-ray Validation & Orientation (Member 01 - Harsha S.N.)
**Focus:** Image Quality Assurance (IQA)  
Acts as the system’s "Gatekeeper." It utilizes **EfficientNetB0** and **OpenCV** to:
* Detects and auto-corrects image orientation (90°, 180°, 270°) and mirrored/flipped X-rays.
* Evaluate image quality using a weighted score (Sharpness & Exposure).
* Filter out non-dental artifacts to ensure diagnostic reliability.

### 2. Automated Dental Disease Identification (Member 02 - Wijerathna U.H.S.U)
**Focus:** Diagnostic Intelligence  
Utilizes the **YOLO11** architecture to transform the diagnostic workflow:
* Instantly categorizes radiographs into: Caries, Bone Loss, Healthy Structures, or Artifacts.
* Provides quantitative severity grading (Level 1, 2, or 3) for lesions.
* Optimized via **ONNX Runtime** for high-speed CPU performance.

### 3. Intelligent Teeth Alignment & Progress Tracking (Member 03 - BANDARANAYAKE B M R L)
**Focus:** Longitudinal Comparison  
Monitors structural alignment changes over time by comparing historical and current X-rays:
* Identifies changes in tooth positioning, crowding, and spacing.
* Generates a composite **Dental Health Score (DHS)**.
* Provides side-by-side timeline visualizations for orthodontic monitoring.

### 4. AI-Based Personalized Care Planning (Member 04 - MADHUSHANI K.H.S.A)
**Focus:** Predictive Risk Assessment  
Combines diagnostic outputs with patient-specific parameters (Age, Lifestyle, History):
* Predicts a personalized oral health risk score using supervised ML models.
* Generates tailored preventive care plans (Hygiene, Diet, Urgency).
* Utilizes an **Explainable AI (XAI)** layer for patient-friendly explanations.

---

## Tech Stack
* **Language:** Python 3.9+
* **Deep Learning:** TensorFlow 2.x, YOLO11, EfficientNetB0
* **Computer Vision:** OpenCV, NumPy
* **Backend:** Flask / FastAPI
* **Frontend:** React.js 

---

## Installation & Setup
1. Clone the repository:
   ```bash
   git clone [https://github.com/YourRepo/R26-IT-111.git](https://github.com/YourRepo/R26-IT-111.git)