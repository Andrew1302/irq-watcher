#!/bin/bash

echo "Building IRQ Watcher API..."

# Build for local development
echo "Building for local development..."
cd api
go build -o ../bin/irq-watcher main.go
cd ..

# Build for Raspberry Pi (cross-compile)
echo "Building for Raspberry Pi..."
cd api
GOOS=linux GOARCH=arm GOARM=6 go build -o ../bin/irq-watcher-arm main.go
cd ..

echo "Build complete!"
echo "Local binary: bin/irq-watcher"
echo "Raspberry Pi binary: bin/irq-watcher-arm"
