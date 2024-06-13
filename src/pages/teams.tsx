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

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function TeamIconImage(props: {iconPath: string, teamName: string}) {
    const [iconUrl, setIconUrl] = useState<string>('');

    useEffect(() => {
      async function fetchIconUrl() {
        if (props.iconPath) {
          const iconRef = ref(storage, props.iconPath);
          const url = await getDownloadURL(iconRef);
          setIconUrl(url);
        } else {
          setIconUrl('/images/no-image.png');
        }
      }
      fetchIconUrl();
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
    <div>
      <h1>チーム一覧</h1>
      <ul>
        {teams.map(team => (
          <li key={team.id}>
            <TeamIconImage iconPath={team.iconPath} teamName={`${team.name}`} />
            <p>{team.id}: {team.name}</p>
            <span>{team.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
