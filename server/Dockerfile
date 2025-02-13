FROM python:3.10-slim

WORKDIR /app

# Copy the application files
COPY . /app/

# Install dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir flask gunicorn
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 8080 for the app
EXPOSE 8080

# Define environment variables for Flask
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=8080

# Run migrations and start the app
CMD ["sh", "-c", "flask db upgrade && gunicorn -b 0.0.0.0:8080 app:app"]