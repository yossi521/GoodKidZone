import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import CharacterCard from '@/components/CharacterCard';

export default function Characters() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Character.list().then((list) => {
      setCharacters(Array.isArray(list) ? list : list.items || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-brand-pink" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">ספר הדמויות</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          שלוש הדמויות הקבועות של Glow Grove. ה-Character Bible הוא הבסיס לכל פרק — אסור ליצור פרק בלי
          להשתמש בו, כדי שדמות תיראה אותו דבר בכל סצנה.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </div>
    </div>
  );
}