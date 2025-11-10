#!/bin/bash

# HarfLand Game Deployment Script
# This script helps set up and deploy the HarfLand game

echo "🎮 HarfLand Game Deployment Script"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null && ! command -v mongo &> /dev/null; then
    echo "⚠️  MongoDB is not installed locally. You'll need to provide a MongoDB URI."
fi

# Function to setup backend
setup_backend() {
    echo ""
    echo "🔧 Setting up Backend..."
    cd backend
    
    # Install dependencies
    echo "📦 Installing backend dependencies..."
    npm install
    
    # Copy environment file if it doesn't exist
    if [ ! -f .env ]; then
        echo "📋 Creating backend environment file..."
        cp .env.example .env
        echo "⚠️  Please edit backend/.env with your configuration"
    fi
    
    cd ..
    echo "✅ Backend setup complete!"
}

# Function to setup frontend
setup_frontend() {
    echo ""
    echo "🎨 Setting up Frontend..."
    cd frontend
    
    # Install dependencies
    echo "📦 Installing frontend dependencies..."
    npm install
    
    # Copy environment file if it doesn't exist
    if [ ! -f .env ]; then
        echo "📋 Creating frontend environment file..."
        cp .env.example .env
        echo "⚠️  Please edit frontend/.env with your configuration"
    fi
    
    cd ..
    echo "✅ Frontend setup complete!"
}

# Function to seed database
seed_database() {
    echo ""
    echo "🌱 Seeding database with sample data..."
    cd backend
    
    if npm run seed; then
        echo "✅ Database seeded successfully!"
        echo "📝 Demo accounts created:"
        echo "   Admin: admin@harfland.com / admin123"
        echo "   Users: player1@example.com through player5@example.com / user123"
    else
        echo "❌ Failed to seed database. Please check your MongoDB connection."
    fi
    
    cd ..
}

# Function to build for production
build_production() {
    echo ""
    echo "🔨 Building for production..."
    
    # Build frontend
    echo "📦 Building frontend..."
    cd frontend
    npm run build
    cd ..
    
    echo "✅ Production build complete!"
    echo "📁 Frontend build files are in frontend/dist/"
}

# Function to start development servers
start_development() {
    echo ""
    echo "🚀 Starting development servers..."
    echo ""
    echo "To start the application:"
    echo "1. Open two terminal windows"
    echo "2. In the first terminal: cd backend && npm run dev"
    echo "3. In the second terminal: cd frontend && npm run dev"
    echo ""
    echo "The application will be available at:"
    echo "🌐 Frontend: http://localhost:5173"
    echo "🔌 Backend API: http://localhost:5000"
    echo "📊 API Health: http://localhost:5000/api/health"
}

# Main menu
while true; do
    echo ""
    echo "What would you like to do?"
    echo "1. Setup Backend"
    echo "2. Setup Frontend"
    echo "3. Setup Both (Recommended)"
    echo "4. Seed Database"
    echo "5. Build for Production"
    echo "6. Start Development Servers"
    echo "7. Exit"
    echo ""
    read -p "Enter your choice (1-7): " choice
    
    case $choice in
        1)
            setup_backend
            ;;
        2)
            setup_frontend
            ;;
        3)
            setup_backend
            setup_frontend
            ;;
        4)
            seed_database
            ;;
        5)
            build_production
            ;;
        6)
            start_development
            ;;
        7)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please enter a number between 1 and 7."
            ;;
    esac
done