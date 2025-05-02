# 🏋️‍♂️ Fitness Tracker Demo - Web Edition

![Live Demo Screenshot](https://github.com/user-attachments/assets/09b6c732-0cd9-40d5-a38d-1de569dd051b)
![Live Demo Screenshot](https://github.com/user-attachments/assets/c89c30a7-1c69-4c33-a919-d94407297ace)

> A real-time fitness tracking web application that uses TensorFlow.js and pose detection to monitor exercise form, count repetitions, and provide feedback — all through your webcam!

---

## 🚀 Features

- 🎯 **Real-Time Pose Detection** – powered by TensorFlow.js and MoveNet/PoseNet.
- 🧠 **Exercise Recognition** – smart logic to detect current movements.
- 🔁 **Repetition Counting** – via angle thresholds and state machine logic.
- 🛡️ **Form Feedback** – real-time correction cues for safer workouts.
- 🧾 **Exercise Library** – supports multiple common exercises.

---

## 🛠️ Technical Stack

- **Frontend**: React + TypeScript  
- **Styling**: Tailwind CSS  
- **UI Library**: Shadcn UI  
- **Pose Detection**: TensorFlow.js with MoveNet/PoseNet  
- **State Management**: React Hooks + Context API  

---

## 🔐 Privacy First

All pose estimation runs **entirely in-browser**. No video or data is uploaded — your privacy is respected by design.

---

## 🏋️ Supported Exercises

| Exercise      | Preview |
|---------------|---------|
| **Squats**     | ![](https://i.pinimg.com/originals/42/52/27/425227c898782116a5955666be277885.gif) |
| **Bicep Curls**| ![](https://i.pinimg.com/originals/68/4d/50/684d50925eabbdf60f66d4bf7013c9ef.gif) |
| **Push-ups**   | ![](https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2RtcjdoNGxzaGE2dHJwM3hxaHplMnhwcGNjc2VoNHF0Z2VuZ25wNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/7lugb7ObGYiXe/giphy.gif) |
| **Pull-ups**   | ![](https://tunturi.org/Blogs/2022/09-pull-up.gif) |

---

## 🧪 Getting Started

> Follow these steps to get the app running locally:

### 1. 📦 Clone the repo

```bash
git clone https://github.com/Ma7moud12975/Fitness-Tracker-web-v1.git
cd Fitness-Tracker-web-v1
2. 📥 Install dependencies
bash
Copy
Edit
npm install
3. 🧪 Start the dev server
bash
Copy
Edit
npm run dev
4. 🌐 Open the app
Go to http://localhost:3000 in your browser.

5. 🎥 Allow camera access
When prompted, allow access to your webcam to enable pose detection.

6. 🏋️ Start exercising!
Choose your exercise, get in position, and the tracker will do the rest!

🌟 Inspiration
This project was inspired by the Python-based Fitness Tracker Pro, adapted for the modern web using JS and TensorFlow.js.

