# NIAVERSE - 펀딩 플랫폼

혁신적인 프로젝트를 발견하고 투자할 수 있는 모던한 펀딩 플랫폼입니다.

**Developer**: 조희진 (JO-HEEJIN)

## Features

- **Email-based Registration**: Simple registration with email confirmation
- **Secure Authentication**: JWT-based login system
- **Dashboard**: Scrollable list of funding opportunities
- **Project Pages**: Detailed introduction pages for each funding option
- **Purchase Flow**: Direct purchase with custom pricing input
- **Digital Contracts**: Electronic signature feature using finger/mouse input
- **Responsive Design**: Mobile-friendly interface

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Authentication**: JWT (JSON Web Tokens)
- **State Management**: React hooks + localStorage

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/
│   │   │   ├── login/
│   │   │   └── confirm/
│   │   └── contract/
│   ├── dashboard/
│   ├── funding/[id]/
│   ├── login/
│   ├── register/
│   ├── contract/
│   └── page.tsx
├── lib/
│   ├── fundingData.ts
│   └── userStore.ts
└── components/
```

## User Flow

1. **Registration**: Users register with email and receive confirmation
2. **Login**: Email/password authentication
3. **Dashboard**: Browse available funding opportunities
4. **Project Details**: View detailed information about each funding option
5. **Purchase**: Select quantity and enter custom price if desired
6. **Contract**: Fill personal information and sign digitally
7. **Confirmation**: Purchase completed and recorded

## Funding Options

The platform includes three sample funding options:
- **Funding 1**: Technology project (₩100,000 base price)
- **Funding 2**: Energy solution (₩1,000,000 base price)
- **Funding 3**: Healthcare system (₩500,000 base price)

## Features in Detail

### Authentication
- Email-based registration with confirmation system
- JWT token-based authentication
- Secure password hashing with bcrypt

### Purchase Flow
- Flexible pricing with predefined quantity tiers
- Custom price input option
- Real-time price calculation

### Digital Signature
- Canvas-based signature capture
- Touch and mouse support
- Signature validation before contract submission

### Responsive Design
- Mobile-first approach
- Optimized for various screen sizes
- Touch-friendly interface

## Development Notes

- Uses in-memory storage for demo purposes
- Email confirmation links are logged to console
- JWT secret should be set via environment variable in production
- All forms include comprehensive validation

## Future Enhancements

- Database integration
- Email service integration
- Payment processing
- Admin dashboard
- Real-time notifications
- File upload for project images
