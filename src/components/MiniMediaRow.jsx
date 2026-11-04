import SampleMedia from '@/components/SampleMedia';

export default function MiniMediaRow({ title, items = [], color }) {
  if (!items || !items.length) return null;
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/50">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 4).map((item) => (
          <SampleMedia
            key={item}
            label={item}
            color={color}
            badge={null}
            className="h-16 w-16"
            rounded="rounded-2xl"
          />
        ))}
      </div>
    </div>
  );
}