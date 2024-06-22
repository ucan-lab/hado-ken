import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from 'lib/firebase/firebase';
import { useState, useEffect } from 'react';
import SelectBox from 'components/SelectBox';
import Team from 'types/Team';
import Tournament from 'types/Tournament';
import Vote from 'types/Vote';

export default function VoteComponent() {
  const [name, setName] = useState('');
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [third, setThird] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isTournamentDay, setIsTournamentDay] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          setIsTournamentDay(true);
          setTournament(tournament);
        }
      });
    }

    fetchTeams();
    checkTournamentDay();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isTournamentDay || !tournament) {
      alert('本日の投票できません。');
      return;
    }

    if (!name) {
      setError('名前を入力してください。');
      return;
    }

    if (first === second || second === third || first === third) {
      setError('1位から3位には異なるチームを指定してください。');
      return;
    }

    const vote: Omit<Vote, 'id'> = {
      name,
      first: first,
      second: second,
      third: third,
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
      await addDoc(collection(db, 'votes'), vote);
      alert('送信しました！');
    } catch (error) {
      setError('送信に失敗しました。');
      console.error('送信失敗', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-6">HADO {tournament?.name} 大会優勝予想</h1>
      {isTournamentDay ? (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          {error && <p className="text-red-500 mb-4">{error}</p>}
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
            options={teams}
            onChange={(e) => setFirst(e.target.value)}
          />
          <SelectBox
            label="2位予想チーム"
            value={second}
            options={teams}
            onChange={(e) => setSecond(e.target.value)}
          />
          <SelectBox
            label="3位予想チーム"
            value={third}
            options={teams}
            onChange={(e) => setThird(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            予想送信
          </button>
        </form>
      ) : (
        <p className="text-red-500 text-xl">本日の投票できません。</p>
      )}
    </div>
  );
}
