# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/62ec8690-1ea0-459c-a447-9210c3b8d1f7

## Architecture

This project uses a modern hybrid architecture for reliable stock data fetching:

- **Frontend**: React/TypeScript with Vite, shadcn-ui, and Tailwind CSS
- **Edge Functions**: Supabase Edge Functions (Deno/TypeScript)
- **Python Backend**: FastAPI service with yfinance 2.0.0 integration
- **Database**: Supabase PostgreSQL

## Stock Data Integration

The application now uses **yfinance 2.0.0** via a Python FastAPI backend for enhanced stock data accuracy and comprehensive financial metrics. See [YFINANCE_INTEGRATION.md](./YFINANCE_INTEGRATION.md) for detailed information.

### Key Features
- Warren Buffett investment analysis
- Real-time stock data with yfinance 2.0.0
- Thai stock market (SET) support
- Comprehensive financial metrics
- DCA (Dollar Cost Averaging) simulation
- Portfolio tracking and analysis

## Setup and Development

### Frontend Development

Follow these steps for frontend development:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Python Backend Setup

For full functionality with yfinance 2.0.0:

```sh
# Install Python dependencies
pip install -r requirements.txt

# Run the Python backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Or use Docker
docker-compose up -d
```

### Environment Variables

Set the following environment variable in your Supabase Edge Function environment:

- `PYTHON_BACKEND_URL`: URL of the Python backend (e.g., `http://localhost:8000`)

## Development Workflow

1. **Frontend Development**: Use the standard React/Vite workflow
2. **Backend Development**: Run the Python FastAPI server locally
3. **Edge Functions**: Deploy to Supabase with the appropriate environment variables
4. **Testing**: Use the test scripts in `backend/test_service.py`

## Technologies

This project is built with:

### Frontend
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

### Backend
- Python 3.12
- FastAPI
- yfinance 2.0.0
- pandas
- numpy

### Infrastructure
- Supabase (Database & Edge Functions)
- Docker (Python backend deployment)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/62ec8690-1ea0-459c-a447-9210c3b8d1f7) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
