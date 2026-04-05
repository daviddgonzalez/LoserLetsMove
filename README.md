# LoserLetsMove

# Personalized Kinematic Evaluator (PKE)

## Overview

BASIC BASIC Overview:

Hey Vsauce, David here
Essentially it's 5 steps:

1. Input - either video input for the minimum viable product (MVP) OR streamed via computer vision through a websocket connection (Think livestreaming)

2. Extraction - Blazepose - create the "skeleton" that represents the person, 33 joints go into a 33 node graph with bones as edges. Takes care of blurry frames, parts of body out of screen, etc.

3. Euclidean Normalization - center is hips, essentially make it so its the same whether you're 5 feet away or 2 feet away. Also if you're 6 feet or 4 feet. Temporal Resampling - essentially if the original clip is 30 seconds and you send in a 4 minute version, it speeds it up to 30 seconds. If you send in a super fast 15 second clip, it slows it down to 30 seconds. This is so it can compare 30 seconds of dance/exercise to 30 seconds.

4. Embedding Storage/Creation - Embedding is just 256 variables describing the video - we pass a tensor - literally js 2D array - through the neural network to create these embeddings. User sends in 3-5 videos, we create the average of the 3-5 embeddings, then store in supabase.

5. Evaluation - These 256 variables are like angles between body parts, angle you're leaning, etc. We use cosine similarity to compare two embeddings so the general proportions have to be the same, not magnitudes. If your angles are too far from the training data marked wrong, otherwise it's good :]


This project is an asynchronous Computer Vision pipeline designed to evaluate and correct human movement. Rather than comparing users to a rigid "universal expert," the system utilizes a User-Calibrated Siamese Network. It learns an individual's safe, baseline mobility and evaluates daily workouts against their personal biomechanical profile, flagging deviations and isolating the exact joints that broke form.

The system is designed with a dual-ingestion architecture, supporting both real-time data capture from live footage and a fallback MVP handling pre-recorded video uploads.




## Tech Stack
* **Frontend:** React and TypeScript.
* **Backend API:** FastAPI (Python) for asynchronous request handling.
* **Machine Learning:** PyTorch (ST-GCN and Siamese Network).
* **Computer Vision:** OpenCV and MediaPipe Pose.
* **Database & Auth:** Supabase PostgreSQL (pgvector for embeddings, relational tables for user metadata).
* **Object Storage:** Supabase Storage (for MVP video uploads).
* **Containerization & Deployment:** Docker (for containerizing the FastAPI application and PyTorch environment).
* **High-Performance Logic:** C++ (for computationally heavy evaluation algorithms).

## System Architecture

### 1. Data Ingestion (Dual-Path Strategy)
To support both live tracking and a fallback MVP, the pipeline standardizes around a common coordinate payload. 

**Path A: The Live Pipeline (Target)**
* **Process:** The React frontend accesses the user's webcam. MediaPipe JS runs directly in the browser (edge computing) to extract skeletal landmarks frame-by-frame.
* **Transmission:** The frontend streams a lightweight JSON array of x, y, z coordinates to the FastAPI backend via WebSockets. No video data is transmitted, drastically reducing bandwidth and server load.

**Path B: The MVP Fallback (Pre-recorded Uploads)**
* **Process:** The user uploads an .mp4 file via the React frontend to Supabase Storage.
* **Extraction:** The FastAPI backend is triggered asynchronously. It downloads the video, runs OpenCV and MediaPipe in Python to extract the skeletal landmarks, and generates the exact same JSON array format as Path A.

### 2. Base Model (The "Transfer" Foundation)
* **Architecture:** Spatial-Temporal Graph Convolutional Network (ST-GCN).
* **Pre-training Phase:** Pre-trained on AIST++ or Fit3D using Contrastive Loss to learn the temporal dynamics of human movement.

### 3. User Calibration Phase (Few-Shot Fine-Tuning)
* **Input:** 3 to 5 calibration sequences of the user performing the movement correctly.
* **Process:** The final projection layers of the ST-GCN are fine-tuned on the user's calibration data, mapping the acceptable "movement manifold" to their specific anatomy. Embeddings are stored in Supabase PostgreSQL using pgvector.

### 4. Asynchronous Evaluation (The Inference Pipeline)
1. **Embedding Generation:** The coordinate JSON (from Path A or Path B) is normalized (root-relative centering, scale invariance) and passed through the user-calibrated ST-GCN.
2. **Distance Calculation:** The embedding is compared against the user's calibration centroid in the Supabase database.
3. **Algorithmic Fallback:** If the distance exceeds the acceptable threshold, Dynamic Time Warping (DTW) temporally aligns the bad rep with a calibration rep, computing cosine similarity of joint angles to report the exact error.

## Next Steps / Todo
* Set up a Dockerfile for the FastAPI backend containing PyTorch and OpenCV dependencies.
* Initialize Supabase project (PostgreSQL database and Storage buckets).
* Implement the Path B (MVP) Python extraction script.
* Implement data normalization logic (root-centering, scaling).
* Define the ST-GCN architecture in PyTorch.
* Implement the Siamese evaluation logic and thresholding.
