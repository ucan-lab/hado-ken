import Link from 'next/link';

export default function Page() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">HADO券</h1>
      <ul>
        <li><Link href="/teams">チーム一覧</Link></li>
      </ul>
    </div>
  );
}
