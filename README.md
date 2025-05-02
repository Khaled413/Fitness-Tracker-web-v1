
# Fitness Tracker Demo - Web Edition
![image](https://github.com/user-attachments/assets/09b6c732-0cd9-40d5-a38d-1de569dd051b)
![image](https://github.com/user-attachments/assets/c89c30a7-1c69-4c33-a919-d94407297ace)
A real-time fitness tracking web application that uses TensorFlow.js and pose detection to monitor exercise form, count repetitions, and provide feedback for various exercises using your webcam .

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
- https://i.pinimg.com/originals/42/52/27/425227c898782116a5955666be277885.gif
- Bicep Curls
- https://i.pinimg.com/originals/68/4d/50/684d50925eabbdf60f66d4bf7013c9ef.gif
- Push-ups
https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2RtcjdoNGxzaGE2dHJwM3hxaHplMnhwcGNjc2VoNHF0Z2VuZ25wNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/7lugb7ObGYiXe/giphy.gif
- Pull-ups
- https://tunturi.org/Blogs/2022/09-pull-up.gif

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Run the development server with `npm run dev`
4. Open your browser to the local development URL
5. Allow camera access when prompted
6. Start exercising!

## Inspiration

This web application is inspired by the Python-based [Fitness Tracker Pro](https://github.com/a1harfoush/Fitness_Tracker_Pro) project, adapting its functionality for the web platform.

![Untitled-3](https://github.com/user-attachments/assets/3c369613-96d2-48a4-b302-b330bd863fec)
