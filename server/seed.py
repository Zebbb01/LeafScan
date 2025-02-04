from app import app
from models import db, DiseaseInfo

# Set up the app context to access the database
with app.app_context():
    # Check if the DiseaseInfo table is empty
    if DiseaseInfo.query.count() == 0:
        print("Seeding DiseaseInfo table...")
        DiseaseInfo.seed()  # Call the seed method to populate the table
        db.session.commit()
    else:
        print("DiseaseInfo table already contains data.")
