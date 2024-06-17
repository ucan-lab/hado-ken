import { useEffect, useState } from 'react';
import { db } from 'lib/firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Team from 'types/Team';
import TeamIconImage from './TeamIconImage';

export default function TeamList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const querySnapshot = await getDocs(collection(db, 'teams'));
        const teamsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[];

        // hrpの降順で並び替え
        teamsData.sort((a, b) => b.hrp - a.hrp);

        setTeams(teamsData);
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError("Failed to load teams");
      } finally {
        setLoading(false);
      }
    }
    fetchTeams();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">チーム一覧</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map(team => (
          <li key={team.id} className="border p-4 rounded-lg shadow">
            <TeamIconImage iconPath={team.iconPath} teamName={team.name} />
            <p className="mt-2 text-lg font-semibold">{team.name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
