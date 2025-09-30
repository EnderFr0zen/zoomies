# Zoomies: AI-Powered ADHD Learning Support System

> **A predictive, two-way classroom tool with an AI-powered screen pet, progress reports, and teaching-plan recommendations.**

## 🎯 Mission Statement

**TEAM FIGHTER: Addressing growing demand for ADHD detection and learning aid**

### Current State
- **1 in 20** primary school children in Australia have ADHD; only ~8% are diagnosed/treated
- **Lengthy diagnosis**: no single test; typical pathway ≥6 months
- **Teacher workload**: ~55 hrs/week, incl. ~11 weekend hrs assessing students

### Our Vision
- **Early intervention**: identify learning support needs in primary years
- **Transparent**: clear visibility of progress & impact
- **Measurable**: track metrics and improve attention confidently
- **Established student-teacher support** via data insights

## 🚀 Features

### AI-Powered Screen Pet (Koala Coach)
- **Interactive koala companion** that stays in the bottom-right corner across all pages
- **Smart nudges** based on attention detection and screen activity
- **Personalized encouragement** with subject-aware messaging
- **Drag-and-drop functionality** with position persistence
- **Audio feedback** with mute controls
- **10 different koala animations** for various emotional states

### Data Capture & Analysis
- **On-device face/eye cues**: MediaPipe for gaze direction, blink rate, head pose (no video stored)
- **Screen/activity signals**: page visibility, input idle time, OS-level screen-switch events
- **Session context**: subject tracking, task timer, mute state management
- **Privacy by design**: all vision processing on-device; no video storage

### Learning Dashboard
- **Session management**: subject selection, task timing, audio controls
- **Performance tracking**: engagement metrics and progress visualization
- **Class overview**: student progress cards and trend analysis
- **Adaptive recommendations**: context-aware prompts and break suggestions

### Machine Learning Pipeline
- **Attention heuristics (MVP)**: face presence + head pose + tab visibility with smoothing
- **Advanced models (planned)**: lightweight CNN/ViT for gaze stability
- **Temporal analysis**: autoencoder/T-CNN for "off-task" pattern detection
- **Personalization**: bandit/RL-style ranking to learn effective interventions per student

## 🛠️ Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Animation**: Lottie React for koala animations
- **State Management**: Custom React hooks
- **Audio**: Web Audio API
- **Storage**: LocalStorage for session persistence
- **Styling**: CSS3 with responsive design
- **PWA Support**: Manifest.json for installable app

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── KoalaPet.tsx     # Main koala pet component
│   ├── SessionPanel.tsx # Session management UI
│   ├── Dashboard.tsx    # Main dashboard
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useKoalaState.ts      # Koala state machine
│   ├── useSessionContext.ts  # Session management
│   ├── useScreenActivity.ts  # Screen activity detection
│   └── useAttentionDetection.ts # Attention monitoring
├── assets/
│   ├── animations/      # Koala Lottie animations
│   ├── sounds/         # Audio feedback files
│   └── logo.png        # Application logo
└── ...
```

## 🎮 Usage

### For Students
1. **Start a session**: Select your subject and begin learning
2. **Koala companion**: The koala will monitor your focus and provide gentle nudges
3. **Interactive feedback**: Click or drag the koala for engagement
4. **Progress tracking**: Monitor your study time and focus patterns

### For Teachers
1. **Class overview**: Monitor student engagement and progress
2. **Pattern detection**: Identify students who may need additional support
3. **Intervention insights**: Review nudge effectiveness and response times
4. **Progress reports**: Generate actionable insights for parents and staff

## 🔧 Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd zoomies

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Setup
The application runs entirely in the browser with no external API dependencies. All computer vision processing is handled on-device for privacy.

## 🔒 Privacy & Security

- **On-device processing**: All face/eye tracking happens locally
- **No video storage**: No images or videos are saved or transmitted
- **Local data only**: Session data stored in browser localStorage
- **GDPR compliant**: No personal data collection or sharing

## 🎯 Target Users

- **Primary school students** (ages 6-12) with ADHD or attention difficulties
- **Teachers** seeking data-driven insights for classroom management
- **Parents** wanting to support their child's learning journey
- **Educational institutions** focused on inclusive learning

## 📊 Impact Goals

- **Early detection**: Identify learning support needs in primary years
- **Reduced teacher workload**: Automated attention monitoring and reporting
- **Improved student outcomes**: Personalized learning support and engagement
- **Data-driven insights**: Evidence-based teaching plan recommendations

## 🚧 Roadmap

### Phase 1 (Current)
- ✅ Basic koala pet with attention detection
- ✅ Session management and tracking
- ✅ Screen activity monitoring
- ✅ Responsive dashboard interface

### Phase 2 (Next)
- 🔄 Advanced computer vision integration
- 🔄 Machine learning model implementation
- 🔄 Teacher dashboard with analytics
- 🔄 Parent reporting system

### Phase 3 (Future)
- 📋 Multi-classroom management
- 📋 Advanced personalization algorithms
- 📋 Integration with learning management systems
- 📋 Mobile app development

## 🤝 Contributing

We welcome contributions from educators, developers, and researchers interested in ADHD learning support. Please see our contributing guidelines for more information.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

**Zoomies is a classroom focus aid, not a diagnostic tool.** This application is designed to support learning and provide insights, but should not be used as a substitute for professional medical or educational assessment.

---

**Built with ❤️ for ADHD learners and their educators**