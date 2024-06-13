import { useEffect, useState } from 'react';
import { db, storage } from 'lib/firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';

interface Team {
  id: string;
  name: string;
  iconPath: string;
  hrp: number;
}

export default function Page() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function TeamIconImage(props: {iconPath: string, teamName: string}) {
    const [iconUrl, setIconUrl] = useState<string>('');

    useEffect(() => {
      setIconUrl('/images/no-image.png');

      if (props.iconPath) {
        fetchIconUrl();
      }

      async function fetchIconUrl() {
        const iconRef = ref(storage, props.iconPath);
        const url = await getDownloadURL(iconRef);
        setIconUrl(url);
      }
    }, [props.iconPath]);

    return <img src={iconUrl} alt={`${props.teamName} icon`} width={50} height={50} />
  }

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
            <TeamIconImage iconPath={team.iconPath} teamName={`${team.name} icon`} />
            <p className="mt-2 text-lg font-semibold">{team.name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
