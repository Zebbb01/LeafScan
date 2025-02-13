from flask import request, jsonify, session
import pandas as pd
from models import Production, db, SeveritySetting

def init_csv_routes(app):
    @app.route('/api/upload_csv', methods=['POST'])
    def upload_csv():
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        severity = request.form.get('severity')

        if severity:
            try:
                severity_value = int(severity)

                # Update severity in database
                existing_severity = SeveritySetting.query.first()
                if existing_severity:
                    existing_severity.severity = severity_value
                else:
                    new_severity = SeveritySetting(severity=severity_value)
                    db.session.add(new_severity)
                db.session.commit()

            except ValueError:
                return jsonify({'error': 'Invalid severity value. It should be an integer.'}), 400
        else:
            return jsonify({'error': 'Severity value is required.'}), 400

        if file and file.filename.endswith('.csv'):
            try:
                data = pd.read_csv(file)
                if 'Date' not in data.columns or 'Production' not in data.columns:
                    return jsonify({'error': 'Invalid CSV format. Ensure the CSV has Date and Production columns.'}), 400

                db.session.query(Production).delete()
                for _, row in data.iterrows():
                    try:
                        date = pd.to_datetime(row['Date'], errors='coerce').date()
                        if pd.isna(date):
                            return jsonify({'error': f"Invalid date in row: {row}"}), 400

                        production_value = float(row['Production'])
                        new_record = Production(date=date, value=production_value)
                        db.session.add(new_record)

                    except ValueError:
                        return jsonify({'error': f"Invalid production value in row: {row}"}), 400

                db.session.commit()
                return jsonify({'message': 'File uploaded successfully. Data has been replaced.', 'severity': severity_value}), 200

            except Exception as e:
                return jsonify({'error': f"An error occurred: {str(e)}"}), 500
        else:
            return jsonify({'error': 'Invalid file format. Please upload a CSV file.'}), 400

    @app.route('/api/get_severity', methods=['GET'])
    def get_severity():
        """Fetch the latest severity value from the database."""
        severity = SeveritySetting.query.first()
        if severity:
            return jsonify({'severity': severity.severity}), 200
        return jsonify({'severity': None}), 404  # If no severity is set yet