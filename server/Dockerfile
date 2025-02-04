# Use official Python image from Docker Hub
FROM python:3.10.11-slim

# Install dependencies for venv and SSL
RUN apt-get update && apt-get install -y \
    python3-venv \
    openssl \
    libssl-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory to /app
WORKDIR /app

# Copy application files to the container
COPY . /app/

# Create a virtual environment inside the container
RUN python -m venv /venv

# Install pip and update to the latest version
RUN /venv/bin/pip install --upgrade pip

# Install the dependencies from requirements.txt inside the virtual environment
RUN /venv/bin/pip install --no-cache-dir -r requirements.txt

# Expose port 8080 for the app
EXPOSE 8080

# Set environment variables for Flask app
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=80
ENV PATH="/venv/bin:$PATH"

# Run migrations and start the app with gunicorn
CMD ["sh", "-c", "flask db upgrade && gunicorn -b 0.0.0.0:8080 app:app"]
