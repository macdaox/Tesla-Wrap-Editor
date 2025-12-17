'use client';

import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@/components/Editor'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100 text-gray-500">
      Loading Editor...
    </div>
  )
});

export default function Home() {
  return (
    <main>
      <Editor />
    </main>
  );
}
