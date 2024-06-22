import { collection, query, where, getDocs, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from 'lib/firebase/firebase';
import { useState, useEffect } from 'react';
import Modal from 'components/Modal';
import SelectBox from 'components/SelectBox';
import Team from 'types/Team';
import Tournament from 'types/Tournament';
import Vote from 'types/Vote';
import Link from 'next/link';

export default function VoteComponent() {
  const [name, setName] = useState('');
  const [first, setFirst] = useState<{ label: string; value: string } | null>(null);
  const [second, setSecond] = useState<{ label: string; value: string } | null>(null);
  const [third, setThird] = useState<{ label: string; value: string } | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isTournamentDay, setIsTournamentDay] = useState(false);
  const [isBeforeDeadline, setIsBeforeDeadline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      const querySnapshot = await getDocs(collection(db, 'teams'));
      const teamsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));

      // hrpの降順で並び替え
      teamsData.sort((a, b) => b.hrp - a.hrp);

      setTeams(teamsData);
    }

    async function checkTournamentDay() {
      const today = new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Tokyo'
      }).format(new Date()).replace(/\//g, '-');
      const querySnapshot = await getDocs(collection(db, 'tournaments'));
      querySnapshot.docs.forEach(doc => {
        const tournamentData = doc.data() as Omit<Tournament, 'id'>;
        const tournament = { id: doc.id, ...tournamentData };
        if (tournament.gameDate === today) {
          const now = new Date();
          const deadline = new Date();
          deadline.setHours(12, 30, 0, 0);

          if (now <= deadline) {
            setIsBeforeDeadline(true);
          }

          setIsTournamentDay(true);
          setTournament(tournament);
        }
      });
    }

    async function fetchData() {
      await fetchTeams();
      await checkTournamentDay();
      setLoading(false);
    }

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isTournamentDay || !tournament || !isBeforeDeadline) {
      alert('本日の投票はできません。');
      return;
    }

    if (!name) {
      setError('名前を入力してください。');
      return;
    }

    if (!first || !second || !third || first.value === second.value || second.value === third.value || first.value === third.value) {
      setError('1位から3位には異なるチームを指定してください。');
      return;
    }

    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!tournament || !name || !first || !second || !third) return;

    const vote: Omit<Vote, 'id'> = {
      name,
      first: first.value,
      second: second.value,
      third: third.value,
      voteAt: (new Date()).toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      tournamentId: tournament.id,
    };

    try {
      // 既存の同じ名前とトーナメントIDのドキュメントを削除
      const q = query(
        collection(db, 'votes'),
        where('name', '==', name),
        where('tournamentId', '==', tournament.id)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (docSnapshot) => {
        await deleteDoc(doc(db, 'votes', docSnapshot.id));
      });

      await addDoc(collection(db, 'votes'), vote);
      setFlashMessage('送信しました！');
      setTimeout(() => setFlashMessage(null), 3000);
    } catch (error) {
      setError('送信に失敗しました。');
      console.error('送信失敗', error);
    }

    setIsModalOpen(false);
  };

  const teamOptions = teams.map(team => ({ value: team.id, label: team.name }));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      {loading ? (
        <></>
      ) : isTournamentDay ? (
        <>
          <h1 className="text-4xl font-bold mb-6">HADO {tournament?.name} 大会優勝予想</h1>
          {isBeforeDeadline ? (
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
              {error && <p className="text-red-500 mb-4">{error}</p>}
              {flashMessage && <p className="text-green-500 mb-4">{flashMessage}</p>}
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 font-bold mb-2">名前</label>
                <input
                  id="name"
                  type="text"
                  placeholder="名前"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <SelectBox
                label="1位予想チーム"
                value={first}
                options={teamOptions}
                onChange={setFirst}
              />
              <SelectBox
                label="2位予想チーム"
                value={second}
                options={teamOptions}
                onChange={setSecond}
              />
              <SelectBox
                label="3位予想チーム"
                value={third}
                options={teamOptions}
                onChange={setThird}
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                投票
              </button>
            </form>
          ) : (
            <p className="text-red-500 text-xl">投票可能時間を超えました。</p>
          )}
          <Link href="/result">
            <button className="mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
              投票結果ページへ
            </button>
          </Link>
        </>
      ) : (
        <p className="text-red-500 text-xl">本日の投票できません。</p>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        title="投票"
        content="この内容で投票しますか？"
      />
    </div>
  );
}
