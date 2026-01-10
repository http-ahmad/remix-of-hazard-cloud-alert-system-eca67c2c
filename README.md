# ELDQM - Emergency Leakage and Dispersion Selection Model

Advanced industrial safety monitoring system for chemical leak detection and dispersion modeling with real-time alerts.

## Features

- **Gaussian Plume Dispersion Model** - Physics-based atmospheric dispersion calculations
- **Real-time Weather Integration** - Live weather data for accurate modeling
- **Interactive Maps** - Visualize hazard zones on OpenStreetMap
- **Chemical Database** - Comprehensive chemical properties and thresholds
- **Emergency Response Protocols** - Safety guidelines for different hazard levels

## Running in VS Code

### Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **bun**

### Setup Steps

1. **Clone or download the project** to your local machine

2. **Open the project folder in VS Code**
   ```bash
   code /path/to/your/project
   ```

3. **Open the integrated terminal** in VS Code (View → Terminal or `Ctrl+``)

4. **Install dependencies**
   ```bash
   npm install
   ```
   Or with bun:
   ```bash
   bun install
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   Or with bun:
   ```bash
   bun run dev
   ```

6. **Open the app** - Navigate to `http://localhost:5173` in your browser

### VS Code Recommended Extensions

- **ESLint** - For code linting
- **Tailwind CSS IntelliSense** - For Tailwind class autocomplete
- **TypeScript Vue Plugin (Volar)** - For better TypeScript support
- **Prettier** - For code formatting

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Technical Details

### Dispersion Model Parameters

The Gaussian Plume model considers these factors:

| Parameter | Effect on Plume |
|-----------|----------------|
| **Release Rate** | Higher rate → Larger plume (√Q scaling) |
| **Release Height** | Higher release → Further ground touchdown, extended hazard zone |
| **Release Temperature** | Higher temp → More buoyancy rise, wider spread |
| **Ambient Temperature** | Warmer air → More turbulent mixing |
| **Relative Humidity** | Higher humidity → Shorter plume (particle deposition) |
| **Wind Speed** | Higher speed → More dilution, but wider extent |
| **Stability Class** | A (unstable) → vertical mixing; F (stable) → horizontal spread |

### Wind Direction Convention

- **0° = North** (wind coming FROM the north, plume travels SOUTH)
- **90° = East** (wind coming FROM the east, plume travels WEST)
- **180° = South**, **270° = West**

## Project Structure

```
src/
├── components/        # React components
│   ├── ui/           # shadcn/ui components
│   └── ...           # Feature components
├── pages/            # Page components
├── utils/            # Utility functions
│   ├── dispersionModel.ts    # Core dispersion calculations
│   └── chemicalDatabase.ts   # Chemical properties
├── hooks/            # Custom React hooks
└── lib/              # Library utilities
```

## Technologies

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- shadcn/ui components
- Leaflet / React-Leaflet (maps)
- Recharts (charts)

## License

MIT License
