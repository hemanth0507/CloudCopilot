# Intelligent Cloud Security Copilot

A production-ready Intelligent Cloud Copilot platform designed to provide real-time, actionable cloud security and cost intelligence. This project features a modular FastAPI backend with advanced AI-driven analytics and a premium React + Plotly dashboard with futuristic, clean, and interactive visuals.

## 🌟 Key Features

- **Multi-Cloud Telemetry:** Foundational dataset processing for analyzing resources, risks, and costs across different cloud providers.
- **AI-Driven Analytics:** Uses Generative AI (OpenAI / Google Gemini) to provide advanced risk prioritization, anomaly detection, resource insights, and actionable recommendations.
- **Risk-Cost Correlation:** Correlates security risks with cloud spend to offer balanced, strategic insights.
- **Conversational AI Chatbot:** An integrated, jargon-free AI Copilot chatbot with conversational memory to help users understand their cloud posture and remediate issues seamlessly.
- **Premium Dashboard:** A responsive, state-of-the-art React frontend featuring interactive 3D charts, Framer Motion animations, and a clean, minimalist corporate aesthetic.

## 🛠️ Technology Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) - High-performance Python web framework
- [Pandas](https://pandas.pydata.org/) & [NumPy](https://numpy.org/) - Data processing and analytics
- [OpenAI](https://openai.com/) / [Google Generative AI](https://ai.google.dev/) - AI reasoning and chatbot capabilities
- Uvicorn - ASGI server

**Frontend**
- [React](https://reactjs.org/) (Create React App) - UI framework
- [Framer Motion](https://www.framer.com/motion/) - Fluid UI animations
- [Plotly.js](https://plotly.com/javascript/) & `react-plotly.js` - Advanced interactive charting
- Axios - HTTP client for API communication

## 📂 Project Structure

```
cloudproject/
├── backend/
│   ├── main.py                # FastAPI application entry point
│   ├── routes/                # API route modules (resources, risks, cost, AI, etc.)
│   ├── data/                  # Data loaders and processing logic
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables (API keys)
│
├── frontend/
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # React components (Sidebar, ChatPanel, etc.)
│   │   ├── services/          # API integration (api.js)
│   │   └── App.js             # Main React application
│   └── package.json           # Node.js dependencies
│
└── cloud_security_dataset/    # Sample multi-cloud telemetry dataset
```

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+ & npm

### Backend Setup

1. **Navigate to the project root directory (or backend folder if separated).**
2. **Create and activate a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. **Install the dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your AI provider API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. **Start the FastAPI server:**
   ```bash
   uvicorn main:app --reload --port 8002
   ```
   *The backend will be available at http://localhost:8002. You can view the automated API documentation at http://localhost:8002/docs.*

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```
2. **Install the dependencies:**
   ```bash
   npm install
   ```
3. **Start the React development server:**
   ```bash
   npm start
   ```
   *The frontend will run on http://localhost:3000 and automatically proxy API requests to the backend.*

## 🔒 Security & Privacy

This project utilizes API keys for AI functionalities. Ensure that your `.env` file is included in `.gitignore` and never committed to version control.

## 📄 License

This project is intended for educational, portfolio, and internal demonstration purposes.
