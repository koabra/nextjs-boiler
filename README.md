# NextJS Boilerplate

A complete starter template for building modern web applications with Next.js, authentication, responsive UI components, and more.

## Features

- **Authentication System**: Full-featured authentication with email verification, password reset, and social login support
- **User Management**: User registration, login, and profile management
- **Responsive UI**: Modern UI components built with Tailwind CSS
- **Database Integration**: MongoDB integration with Mongoose for data storage
- **Form Validation**: Client-side form validation with React Hook Form and Zod
- **Type Safety**: Full TypeScript support throughout the codebase
- **Protected Routes**: Middleware for route protection based on authentication status
- **Email Support**: Email service using Plunk for verification and password reset

## Tech Stack

- [Next.js](https://nextjs.org/): React framework for building web applications
- [NextAuth.js](https://next-auth.js.org/): Authentication library for Next.js
- [MongoDB](https://www.mongodb.com/): NoSQL database for data storage
- [Mongoose](https://mongoosejs.com/): MongoDB object modeling for Node.js
- [Tailwind CSS](https://tailwindcss.com/): Utility-first CSS framework
- [React Hook Form](https://react-hook-form.com/): Forms with validation
- [Zod](https://zod.dev/): TypeScript-first schema validation
- [Plunk](https://useplunk.com/): Email delivery service with templates
- [TypeScript](https://www.typescriptlang.org/): Static type-checking

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn
- MongoDB database (local or Atlas)
- Plunk account for email services

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/nextjs-boilerplate.git
cd nextjs-boilerplate
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Update the `.env.local` file with your own configuration values.

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
nextjs-boilerplate/
├── src/
│   ├── app/                   # App Router pages and layouts
│   │   ├── (dashboard)/       # Dashboard routes (protected)
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable components
│   │   ├── auth/              # Authentication components
│   │   ├── layout/            # Layout components
│   │   └── ui/                # UI components
│   ├── lib/                   # Utility libraries
│   ├── models/                # MongoDB models
│   └── types/                 # TypeScript types
├── public/                    # Static assets
└── ...
```

## Environment Variables

The following environment variables are required:

- `MONGODB_URI`: Default MongoDB connection string
- `MONGODB_URI_LOCAL`: MongoDB connection string for development (optional, falls back to MONGODB_URI)
- `MONGODB_URI_PROD`: MongoDB connection string for production (optional, falls back to MONGODB_URI)
- `NEXTAUTH_URL`: Base URL of your application
- `NEXTAUTH_SECRET`: Secret for NextAuth.js
- `PLUNK_API_KEY`: API key for Plunk email service
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

The database connection will automatically use the appropriate MongoDB URI based on the environment:

- In development: Uses `MONGODB_URI_LOCAL` if available, otherwise falls back to `MONGODB_URI`
- In production: Uses `MONGODB_URI_PROD` if available, otherwise falls back to `MONGODB_URI`

## Customization

### Adding New Pages

Create new pages in the appropriate directory inside `src/app/`. For protected routes, place them in the `(dashboard)` directory.

### Modifying UI Components

Modify or extend UI components in the `src/components/` directory according to your needs.

### Database Models

Add new database models in the `src/models/` directory following the Mongoose schema pattern.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Plunk Documentation](https://docs.useplunk.com/)
