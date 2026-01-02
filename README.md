# 10x-cards

AI-powered flashcard generation app for efficient learning with spaced repetition.

[![Node.js Version](https://img.shields.io/badge/node-22.14.0-green.svg)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/Astro-5.x-orange.svg)](https://astro.build/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

10x-cards is a web application designed to help users quickly create and manage educational flashcard sets. The application leverages Large Language Models (LLM) via API to generate flashcard suggestions based on user-provided text, significantly reducing the time and effort required to create high-quality study materials.

**Key Problem Solved:** Manual creation of high-quality flashcards requires significant time and effort, which discourages users from utilizing the effective learning method of spaced repetition. 10x-cards streamlines this process by automating the generation of questions and answers, making effective learning more accessible.

**Core Features:**

- **AI-powered flashcard generation** from pasted text (1,000 - 10,000 characters)
- **Review and approval workflow** for AI-generated flashcards
- **Manual flashcard creation and management**
- **User authentication** with secure account management
- **Spaced repetition learning sessions** using proven algorithms
- **Statistics tracking** for flashcard generation and acceptance rates

## Tech Stack

### Frontend

- **[Astro 5](https://astro.build/)** - Fast, content-focused web framework with minimal JavaScript
- **[React 19](https://reactjs.org/)** - Interactive UI components where needed
- **[TypeScript 5](https://www.typescriptlang.org/)** - Static typing for better developer experience
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Accessible React component library

### Backend

- **[Supabase](https://supabase.com/)** - Backend-as-a-Service with:
  - PostgreSQL database
  - Built-in user authentication
  - Open-source and self-hostable

### AI Integration

- **[OpenRouter.ai](https://openrouter.ai/)** - Access to multiple LLM providers (OpenAI, Anthropic, Google, and more)

### CI/CD & Hosting

- **GitHub Actions** - CI/CD pipelines
- **DigitalOcean** - Application hosting via Docker

### Testing

- **[Vitest](https://vitest.dev/)** - Fast unit testing framework with native ESM and TypeScript support
- **[Testing Library](https://testing-library.com/)** - React component testing from user perspective
- **[Playwright](https://playwright.dev/)** - Cross-browser E2E testing framework
- **[MSW](https://mswjs.io/)** - API mocking for integration tests

## Getting Started Locally

### Prerequisites

- **Node.js 22.14.0** (use [nvm](https://github.com/nvm-sh/nvm) for version management)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/bartoszc/10x-project-flashcards.git
   cd 10x-project-flashcards
   ```

2. **Set the correct Node.js version:**

   ```bash
   nvm use
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:4321`

## Available Scripts

| Script                  | Description                            |
| ----------------------- | -------------------------------------- |
| `npm run dev`           | Start the Astro development server     |
| `npm run build`         | Build the production-ready application |
| `npm run preview`       | Preview the production build locally   |
| `npm run lint`          | Run ESLint to check for code issues    |
| `npm run lint:fix`      | Automatically fix ESLint issues        |
| `npm run format`        | Format code with Prettier              |
| `npm run astro`         | Run Astro CLI commands                 |
| `npm run test`          | Run unit tests with Vitest             |
| `npm run test:watch`    | Run tests in watch mode                |
| `npm run test:ui`       | Open Vitest UI for interactive testing |
| `npm run test:coverage` | Run tests with coverage report         |
| `npm run test:e2e`      | Run E2E tests with Playwright          |
| `npm run test:e2e:ui`   | Open Playwright UI for E2E tests       |

## Project Scope

### MVP Features (In Scope)

- ✅ User registration and authentication
- ✅ AI-powered flashcard generation from text input
- ✅ Review, edit, accept, or reject AI-generated flashcards
- ✅ Manual flashcard creation (front and back)
- ✅ Flashcard editing and deletion
- ✅ Spaced repetition learning sessions (using open-source algorithm)
- ✅ Generation statistics tracking
- ✅ GDPR-compliant data handling

### Out of Scope (Future Considerations)

- ❌ Custom spaced repetition algorithm
- ❌ Gamification features
- ❌ Native mobile applications (web only for MVP)
- ❌ Multi-format document import (PDF, DOCX, etc.)
- ❌ Public API
- ❌ Flashcard sharing between users
- ❌ Advanced notification system
- ❌ Advanced keyword-based flashcard search

## Project Status

🚧 **In Development** - This project is currently in active development as an MVP (Minimum Viable Product).

### Success Metrics

- **Target:** 75% acceptance rate for AI-generated flashcards
- **Target:** 75% of flashcards created using AI assistance

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ using Astro, React, and AI
</p>
