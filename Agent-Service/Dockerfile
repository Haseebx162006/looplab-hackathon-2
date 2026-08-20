FROM python:3.11-slim

WORKDIR /app

# Copy dependency definitions
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY app/ /app/app/

# Expose the port
EXPOSE 8000

# Set Python path to find app module
ENV PYTHONPATH=/app

# Start the FastAPI server
CMD ["python", "app/main.py"]
