import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from 'lib/firebase/firebase';
import { FaMedal } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Team from 'types/Team';
import Tournament from 'types/Tournament';
import Vote from 'types/Vote';

export default function Results() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isTournamentDay, setIsTournamentDay] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      const querySnapshot = await getDocs(collection(db, 'teams'));
      const teamsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));

      // hrpの降順で並び替え
      teamsData.sort((a, b) => b.hrp - a.hrp);

      setTeams(teamsData);
    }

    async function fetchVotes(tournamentId: string) {
      const q = query(
        collection(db, 'votes'),
        where('tournamentId', '==', tournamentId),
        orderBy('voteAt', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const votesData = querySnapshot.docs.map(doc => doc.data() as Vote);
      setVotes(votesData);
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
          fetchVotes(tournament.id);
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

  // 日本時間の現在時刻を取得
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const deadline = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  deadline.setHours(12, 30, 0, 0);

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {loading ? (
        <></>
      ) : isTournamentDay && tournament ? (
        now >= deadline ? (
          <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl w-full">
            <h1 className="text-2xl font-bold text-center mb-6">HADO {tournament?.name} 大会投票結果</h1>
            <ul className="space-y-4">
              {votes.map((vote, index) => (
                <li key={index} className="p-4 bg-gray-50 rounded-lg shadow-md">
                  <p className="text-lg font-semibold">{vote.name} さんの予想</p>
                  <p>
                    <span className="flex items-center">
                      <FaMedal className="text-yellow-500 mr-2" /> {getTeamName(vote.first)}
                    </span>
                  </p>
                  <p>
                    <span className="flex items-center">
                      <FaMedal className="text-gray-400 mr-2" /> {getTeamName(vote.second)}
                    </span>
                  </p>
                  <p>
                    <span className="flex items-center">
                      <FaMedal className="text-orange-400 mr-2" /> {getTeamName(vote.third)}
                    </span>
                  </p>
                  <p className="text-gray-500 text-sm mt-2">投票日時: {vote.voteAt}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <p className="text-red-500 text-lg mt-4">投票結果は 12:30 以降に表示されます。</p>
            <Link href="/vote">
              <button className="mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                投票ページへ
              </button>
            </Link>
          </>
        )
      ) : (
        <>
          <h1 className="text-2xl font-bold text-center mb-6">HADO大会投票結果ページ</h1>
          <p className="text-red-500 text-lg mt-4">本日は大会がありません。</p>
        </>
      )}
    </div>
  );
}
