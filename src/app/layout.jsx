import './globals.css';
import LiveLogDrawer from '@/components/LiveLogDrawer';

export const metadata = {
  title: 'Notes AI — جزوه هوشمند',
  description: 'صدای کلاس رو ضبط کن، بقیه رو به هوش مصنوعی بسپار.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-gray-50/50 min-h-dvh">
        {children}
        <LiveLogDrawer />
      </body>
    </html>
  );
}

