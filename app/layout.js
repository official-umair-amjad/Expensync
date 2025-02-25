// app/layout.js
import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'Group Expense Tracker',
  description: 'Collaborative Expense Tracker built with Next.js and Supabase',
};

export default function RootLayout({ children }) {

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
