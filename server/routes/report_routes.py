from flask import jsonify
import pandas as pd
from routes.utility import fetch_production_data
from models import SeveritySetting
from statsmodels.tsa.holtwinters import ExponentialSmoothing

def get_severity_label(severity):
    """Function to map severity value to a label."""
    if 1 <= severity <= 3:
        return 'Low'
    elif 4 <= severity <= 6:
        return 'Moderate'
    elif 7 <= severity <= 10:
        return 'Severe'
    else:
        return 'Mixed'

def init_report_routes(app):
    @app.route('/api/report_data', methods=['GET'])
    def get_report_data():
        """Fetches report data, including severity adjustments and forecast data."""
        try:
            # Fetch production data
            production_data = fetch_production_data()
            if production_data.empty:
                return jsonify({'error': 'No production data available. Please upload data first.'}), 400

            # Fetch severity from the database
            severity_record = SeveritySetting.query.first()
            severity_value = severity_record.severity if severity_record else 1
            severity_label = get_severity_label(severity_value)
            loss_percentage = severity_value / 100  # Convert to percentage

            # Adjust production data based on severity
            production_data['adjusted_production'] = production_data['value'] * (1 - loss_percentage)
            production_data['loss'] = production_data['value'] * loss_percentage

            # Forecast the next 8 quarters using Exponential Smoothing
            production_data['date'] = pd.to_datetime(production_data['date'])
            production_data.set_index('date', inplace=True)
            model = ExponentialSmoothing(
                production_data['value'], trend='add', seasonal='add', seasonal_periods=4
            ).fit()
            forecast_values = model.forecast(8)

            # Calculate adjusted production and losses
            adjusted_production = [value * (1 - loss_percentage) for value in forecast_values]
            actual_losses = [value * loss_percentage for value in forecast_values]

            # Return structured data
            report_data = {
                "severity_label": severity_label,
                "severity_value": severity_value,
                "loss_percentage": round(loss_percentage * 100, 2),
                "data": production_data.to_dict(orient='records'),
                "next_8_quarters_forecast": forecast_values.tolist(),
                "adjusted_production": adjusted_production,
                "actual_losses": actual_losses,
            }

            return jsonify(report_data)

        except Exception as e:
            import traceback
            print(traceback.format_exc())  # Print full error
            return jsonify({'error': str(e)}), 500
