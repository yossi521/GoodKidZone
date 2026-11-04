import { Check } from 'lucide-react';
import { PIPELINE_STAGES, stageDone } from '@/lib/statuses';

export default function EpisodePipeline({ status }) {
  return (
    <ol className="flex flex-wrap gap-2">
      {PIPELINE_STAGES.map((stage) => {
        const done = stageDone(status, stage.minIndex);
        return (
          <li
            key={stage.key}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              done ? 'bg-brand-blue/15 text-brand-deep' : 'bg-muted text-muted-foreground'
            }`}
          >
            <span className={`grid h-4 w-4 place-items-center rounded-full ${done ? 'bg-brand-blue text-white' : 'bg-border'}`}>
              {done && <Check className="h-3 w-3" />}
            </span>
            {stage.label}
          </li>
        );
      })}
    </ol>
  );
}