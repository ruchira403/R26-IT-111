
const pool = require('../config/db');

/**
 * @desc    Continue & Proceed - Save Diagnosis and X-ray details to Shared Database
 * @route   POST /api/save-diagnosis
 */
exports.saveCariesDiagnosis = async (req, res) => {
    // Log frontend payload for debugging
    console.log("📥 Incoming Request Body:", JSON.stringify(req.body, null, 2));

    const { image_path, quality_score, confidence_score, exposure, is_blurred, diseases } = req.body;
    const userId = req.user && req.user.userId ? req.user.userId : null;

    // Get a client to start a PostgreSQL transaction
    const client = await pool.connect();

    try {
        
        await client.query('BEGIN');

        // 1. Insert main data into 'dental_records' table and get the auto-generated ID
        const recordQuery = `
            INSERT INTO dental_records (user_id, image_path, quality_score, confidence_score, exposure, is_blurred)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;
        `;
        
       // Set default value (0.0 or true/false) if score is not provided
        const qScore = quality_score !== undefined ? quality_score : 0.0;
        const cScore = confidence_score !== undefined ? confidence_score : 0.0;
        const exp = exposure || 'Normal';
        const blurred = is_blurred !== undefined ? is_blurred : false;

        const recordValues = [userId, image_path || 'No Path', qScore, cScore, exp, blurred];
        const recordResult = await client.query(recordQuery, recordValues);
        const newRecordId = recordResult.rows[0].id; // new Record ID 

        // 2. Use the record ID to save detected diseases into 'detected_diseases' table
        if (diseases && diseases.length > 0) {
            const diseaseQuery = `
                INSERT INTO detected_diseases (record_id, disease_type, severity_level, confidence)
                VALUES ($1, $2, $3, $4);
            `;
            
            // Save multiple diseases using a loop
            for (let disease of diseases) {
                // Accept disease type from frontend (disease_type, type, or label)
                const type = disease.disease_type || disease.type || disease.label || 'Unknown Disease';

                const severity = disease.severity_level || disease.level || disease.severity || 'Unknown';
                
                const confidence = disease.confidence !== undefined && disease.confidence !== null ? disease.confidence : 0.0;

                // Log data inside loop to verify what is being saved
                console.log(`Saving Disease -> Type: ${type}, Severity: ${severity}, Confidence: ${confidence}`);

                await client.query(diseaseQuery, [
                    newRecordId, 
                    type, 
                    severity, 
                    confidence
                ]);
            }
        }

        // Commit data to database if everything is successful
        await client.query('COMMIT');
        console.log(`✅ Success: All data saved for Record ID: ${newRecordId}`);

        return res.status(201).json({
            status: 'Success',
            message: 'Dental X-ray and Caries details (with Severity Levels) saved securely to the shared database.',
            recordId: newRecordId
        });

    } catch (error) {
        // Rollback changes if an error occurs
        await client.query('ROLLBACK');
        console.error('❌ Database Error in cariesController:', error);
        
        return res.status(500).json({ 
            status: 'Error', 
            message: 'Failed to save data to the shared database.',
            details: error.message 
        });
    } finally {
    
        client.release();
    }
};