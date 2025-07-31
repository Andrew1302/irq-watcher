#!/bin/bash

# Configuration
RASPBERRY_IP="192.168.0.171"  # Change to your Raspberry Pi IP
RASPBERRY_USER="pi"

echo "Deploying IRQ Watcher to Raspberry Pi..."

# Build for Raspberry Pi
echo "Building for Raspberry Pi..."
cd api
GOOS=linux GOARCH=arm GOARM=7 go build -o ../bin/irq-watcher-arm main.go
cd ..

# Create bin directory if it doesn't exist
mkdir -p bin

# Copy to Raspberry Pi
echo "Copying to Raspberry Pi..."
scp bin/irq-watcher-arm $RASPBERRY_USER@$RASPBERRY_IP:/home/$RASPBERRY_USER/

# Execute on Raspberry Pi
echo "Starting on Raspberry Pi..."
ssh $RASPBERRY_USER@$RASPBERRY_IP "cd /home/$RASPBERRY_USER && chmod +x irq-watcher-arm && ./irq-watcher-arm"

echo "Deployment complete!"
echo "API should be running at http://$RASPBERRY_IP:8080"
echo "Frontend can be accessed by opening web/index.html in your browser"
