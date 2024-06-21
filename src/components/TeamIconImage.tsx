import { useEffect, useState } from 'react';
import { storage } from 'lib/firebase/firebase';
import { getDownloadURL, ref } from 'firebase/storage';

interface TeamIconImageProps {
  iconPath: string;
  teamName: string;
}

export default function TeamIconImage({ iconPath, teamName }: TeamIconImageProps) {
  const [iconUrl, setIconUrl] = useState<string>('/images/no-image.png');

  useEffect(() => {
    const cachedUrl = localStorage.getItem(iconPath);

    if (cachedUrl) {
      setIconUrl(cachedUrl);
    } else if (iconPath) {
      fetchIconUrl();
    }

    async function fetchIconUrl() {
      const iconRef = ref(storage, iconPath);
      const url = await getDownloadURL(iconRef);
      setIconUrl(url);
      localStorage.setItem(iconPath, url);
    }
  }, [iconPath]);

  return <img src={iconUrl} alt={`${teamName} icon`} width={50} height={50} />;
}
