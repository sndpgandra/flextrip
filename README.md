# FlexiTrip - Multi-Generational Travel Planning

AI-powered travel planning that works for everyone in the family - from toddlers to grandparents.

## 🌟 Features

- **Multi-Generational Focus**: Built specifically for families with diverse age groups
- **AI-Powered Recommendations**: Smart suggestions considering mobility, interests, and cultural preferences
- **Progressive Web App**: Works offline and installs like a native app
- **Privacy First**: No account required, anonymous sessions with automatic cleanup
- **Universal Accessibility**: Designed for users aged 5-95 with WCAG 2.1 AA compliance

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sndpgandra/flextrip.git
   cd flextrip
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   - Supabase credentials for database
   - OpenRouter.ai API key for AI functionality

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Vercel Functions
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenRouter.ai (Claude 3.5 Sonnet, GPT-4o mini)
- **Hosting**: Vercel
- **PWA**: next-pwa

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

## 🏛️ Architecture

FlexiTrip follows a cost-optimized architecture:

- **Anonymous Sessions**: UUID-based sessions without account requirements
- **Age-Aware AI**: Context-aware recommendations for all family members
- **Progressive Enhancement**: Works on all devices with offline capabilities
- **Cost Optimization**: Designed for $20-50/month operational costs

## 🗄️ Database Schema

Core tables:
- `sessions` - Anonymous user sessions
- `travelers` - Family member profiles with age-specific attributes  
- `trips` - Saved conversations and trip plans

## 🔧 Development Guidelines

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Component-based architecture

### Accessibility
- Minimum 18px font size
- 44px minimum touch targets
- WCAG 2.1 AA compliance
- Keyboard navigation support

### Performance
- Page load time: <3 seconds on 3G
- Chat streaming: <1 second to start
- Mobile PageSpeed score: >85

## 🚀 Deployment

The app is configured for easy deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## 📞 Support

For support and questions, please open an issue on GitHub.