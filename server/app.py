from flask import Flask, jsonify
from flask_mail import Mail
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from models import db
from dotenv import find_dotenv, load_dotenv
import os

# Import routes
from routes.user_routes import init_user_routes
from routes.forecasting_routes import init_forecasting_routes
from routes.image_routes import init_image_routes
from routes.csv_routes import init_csv_routes
from routes.report_routes import init_report_routes

# Load environment variables
load_dotenv(find_dotenv())

# Validate required environment variables
required_env_vars = [
    'SECRET_KEY', 'SQLALCHEMY_DATABASE_URI', 'MAIL_SERVER',
    'MAIL_PORT', 'MAIL_USERNAME', 'MAIL_PASSWORD', 'PEPPER'
]
for var in required_env_vars:
    if not os.getenv(var):
        raise ValueError(f"Environment variable {var} is not set!")

app = Flask(__name__)

# Flask Configurations
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = os.getenv('SQLALCHEMY_TRACK_MODIFICATIONS', 'False') == 'True'
app.config['SQLALCHEMY_ECHO'] = os.getenv('SQLALCHEMY_ECHO', 'True') == 'True'
# Mail configuration
app.config.update(
        MAIL_SERVER=os.getenv('MAIL_SERVER'),
    MAIL_PORT=int(os.getenv('MAIL_PORT', 587)),
    MAIL_USERNAME=os.getenv('MAIL_USERNAME'),
    MAIL_PASSWORD=os.getenv('MAIL_PASSWORD'),
    MAIL_USE_TLS=os.getenv('MAIL_USE_TLS', 'True').lower() == 'true',
    MAIL_DEFAULT_SENDER=os.getenv('MAIL_DEFAULT_SENDER')
)

mail = Mail(app)
bcrypt = Bcrypt(app)

# Initialize PostgreSQL database and migration
db.init_app(app)
migrate = Migrate(app, db)

# Add a status route to display if the backend is running
@app.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "Backend is running!"})

# Initialize routes
init_user_routes(app, mail)
init_forecasting_routes(app)
init_image_routes(app)
init_csv_routes(app)
init_report_routes(app)

if __name__ == "__main__":
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=8080, debug=debug_mode)