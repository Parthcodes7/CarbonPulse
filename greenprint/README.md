# CarbonPulse AI 🌍

**CarbonPulse AI** is an interactive, real-time web application built to help users understand, visualize, and reduce their environmental impact. 

This project was proudly built as part of the **PromptWar** challenge hosted by **@Hack2Skill**. Guided by the goal of creating impactful solutions, **Google's AI tools** were heavily leveraged during the development process to write, refine, and seamlessly deploy this application onto **Google Cloud** infrastructure.

🔗 **[Live Demo on Google Cloud](https://storage.googleapis.com/carbonpulse-500106-hosting/index.html)**

---

## ✨ Key Features

- **Immersive 3D Visuals:** A highly interactive, rotating 3D Earth built with React Three Fiber. Watch the globe dynamically react with orbiting CO₂ molecules and green leaves based on your inputs.
- **Smart Carbon Calculation:** An intelligent engine calculating your footprint across four key metrics: Energy, Transport, Food, and Lifestyle/Shopping.
- **Global Benchmarking:** Instantly compares your emissions against global averages and the Paris Agreement targets.
- **Actionable Eco-Plan:** Generates a personalized, step-by-step action plan ranking lifestyle changes by difficulty and their direct impact on reducing your emissions.
- **Serverless & Fast:** Deployed completely serverless via Google Cloud Storage for instantaneous loading and global reach.

---

## 🛠️ Tech Stack

- **Frontend Framework:** React 19, Vite, TypeScript
- **3D Graphics & Animation:** Three.js, React Three Fiber, React Three Drei, GSAP
- **Styling:** Tailwind CSS
- **Deployment:** Google Cloud Storage (GCP)
- **AI Integration:** Developed with the assistance of Google AI tools.

---

## 🚀 Local Setup & Installation

Follow these steps to run CarbonPulse AI on your local machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Parthcodes7/CarbonPulse.git
   cd CarbonPulse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   *The app will be available at `http://localhost:5173`*

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

- `src/components/three/EarthGlobe.tsx` - Contains the 3D logic and textures for the interactive globe.
- `src/lib/calculationEngine.ts` - The core TypeScript logic processing user inputs to calculate kg CO₂e.
- `src/pages/` - Contains the individual views (Intro, Calculator, Results).
- `src/assets/` - Contains static images and optimized textures for the 3D models.

---

## 🙌 Acknowledgements

A massive thank you to **Hack2Skill** for organizing the PromptWar and pushing developers to build technology that drives positive change. Let's build a greener future, one line of code at a time!

#Hack2Skill #PromptWar #GoogleCloud #GeminiAI #ClimateTech #WebDevelopment
