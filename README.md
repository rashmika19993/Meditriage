# MediTriage AI

Intelligent prescription extraction and clinical triage for **IT6070 – Emerging Technologies**.

Academic simulation for Dr. Anusha Silva (pseudonym), an outpatient GP who reviews handwritten slips in short consultations. The app reads a prescription image, normalizes trade names to active ingredients, and screens drug–drug interactions before the visit.

**Not a medical device. Not for clinical use.**

## What it does

1. **Prescription intake.** Drag and drop a PNG, JPEG, or WebP slip, or load a built-in sample. Two SVG slips in `public/samples/` are ready for a recorded demo.
2. **Multimodal extraction.** `POST /api/triage` sends the image to Gemini 3.1 Flash Lite and returns structured medications: brand, active ingredient, dose, frequency, and a confidence score from 0 to 1.
3. **Interaction screening.** The same route classifies pairs as HIGH, MODERATE, or LOW and writes a 2–3 bullet pre-consultation briefing.
4. **Human review.** Cards with confidence under 0.70, or flagged handwriting, show an amber review badge. Brand, molecule, dosage, and frequency stay editable. **Re-evaluate Interactions** rescreens the edited list without a new image.
5. **Offline fallback.** If the key is missing, the request times out (45s), or Gemini returns 503 or 429, the client screens against `lib/offlineInteractions.json` (21 critical pairs with aliases) and shows an offline banner.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4
- Official Google Gen AI SDK (`@google/genai`), model `gemini-3.1-flash-lite`
- No standalone backend — server logic lives in `app/api/triage/route.ts`

## Setup

```bash
npm install
cp .env.local.example .env.local
```

Add a Gemini API key to `.env.local`:

```
GEMINI_API_KEY=your_key_here
```

The route initializes `new GoogleGenAI({})`, which reads `GEMINI_API_KEY` from the environment. Leave it empty to demo the offline matrix only.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

| Command | Purpose |
| --- | --- |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## Demo (video recording)

1. Click **Sample 1 — High Risk** (Warfarin 5mg daily, Aspirin 100mg daily, Ibuprofen 400mg PRN).
2. Click **Extract & Screen Prescription**.
3. Confirm HIGH bleeding-risk alerts and the pre-consultation briefing.
4. Click **Sample 2 — Moderate Risk** (Metformin 500mg BD, Ciprofloxacin 500mg BD), then extract again.
5. Edit a medication name inline and click **Re-evaluate Interactions**.
6. Use **Export Clinical Briefing** to copy the summary to the clipboard.

### Offline / API outage

Without `GEMINI_API_KEY`, or when Gemini fails, the UI shows an offline banner and screens the sample medication lists in `lib/triageClient.ts` against the embedded matrix. Uploads that are not a sample still fall back, but OCR cannot invent line items — add medications manually and re-evaluate.

## API

`POST /api/triage` accepts one of two JSON bodies:

```json
{ "imageBase64": "<raw or data-url base64>", "mimeType": "image/png" }
```

```json
{ "medications": [/* ExtractedMedication[] */] }
```

Images over 10MB return `413`. A missing image and empty medication list return `400`. Gemini failures return `503` so the client can fall back. Validation errors are not treated as an outage.

Successful responses match `TriageResult` in `lib/types.ts`: medications, interaction alerts, `requiresHumanReview`, and `clinicalBriefing`.

## Project structure

```text
app/
  layout.tsx                 # Metadata and dark clinical shell
  page.tsx                   # Server page that mounts the dashboard
  globals.css
  api/triage/route.ts        # Gemini OCR + interaction screening
components/
  ClinicalDashboard.tsx      # Intake / results state
  ImageUploader.tsx          # Dropzone and sample presets
  MedicationCard.tsx         # Editable line items and review badge
  TriageSummary.tsx          # Alerts, briefing, export, re-evaluate
  FallbackBanner.tsx         # Offline and human-review banners
lib/
  types.ts                   # Shared interfaces
  triageClient.ts            # Fetch, timeout, and offline switch
  screenOffline.ts           # Client matrix matching and result coercion
  offlineInteractions.json   # Critical interaction pairs
  utils.ts
public/samples/              # High-risk and moderate-risk SVG slips
.env.local.example
```

## Disclaimer

This project is an educational prototype for multimodal OCR and contraindication-screening UX. Always rely on licensed clinicians and validated clinical references for patient care.
"# Meditriage" 
