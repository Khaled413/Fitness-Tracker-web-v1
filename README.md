
# Fitness Tracker Pro - Web Edition

A real-time fitness tracking web application that uses TensorFlow.js and pose detection to monitor exercise form, count repetitions, and provide feedback for various exercises using your webcam.

## Features

- **Real-Time Pose Detection**: Uses TensorFlow.js pose detection to track key body landmarks during workouts.
- **Exercise Recognition**: Identifies the current exercise being performed by analyzing body movements and positions.
- **Repetition Counting**: Counts exercise repetitions by monitoring joint angles and detecting when they cross specific thresholds.
- **Form Feedback**: Provides immediate feedback on exercise form to help you perform exercises safely and effectively.
- **Exercise Library**: Supports multiple exercises including squats, pushups, bicep curls, and shoulder presses.

## Technical Implementation

- **Frontend**: React with TypeScript, styled with Tailwind CSS
- **Pose Detection**: TensorFlow.js and PoseNet/MoveNet models
- **UI Components**: Shadcn UI component library
- **State Management**: React hooks and context

## Privacy

All processing happens locally in your browser. No video data is stored or sent to any server, ensuring your privacy is protected.

## Supported Exercises

- Squats
- Push-ups
- Bicep Curls
- Shoulder Presses

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Run the development server with `npm run dev`
4. Open your browser to the local development URL
5. Allow camera access when prompted
6. Start exercising!

## Inspiration

This web application is inspired by the Python-based [Fitness Tracker Pro](https://github.com/a1harfoush/Fitness_Tracker_Pro) project, adapting its functionality for the web platform.

