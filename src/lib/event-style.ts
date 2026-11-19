// How each kind of event looks: chip colors, the colored rail on event cards
// (left or top edge), month-view dots, the icon badge, and an icon. One place,
// so the list, month view, and header agree. Class names are written out in full
// so Tailwind can find them.
import type { EventType } from './events';

type Icon = 'users' | 'cup' | 'megaphone' | 'building' | 'book' | 'calendar';
export const EVENT_STYLE: Record<EventType, { chip: string; rail: string; top: string; dot: string; badge: string; icon: Icon }> = {
  meeting: { chip: 'bg-black text-white', rail: 'border-l-black', top: 'border-t-black', dot: 'bg-black', badge: 'bg-black text-white', icon: 'users' },
  social: { chip: 'bg-red-4 text-red-dark', rail: 'border-l-red', top: 'border-t-red', dot: 'bg-red', badge: 'bg-red-4 text-red-dark', icon: 'cup' },
  action: { chip: 'bg-red-dark text-white', rail: 'border-l-red-dark', top: 'border-t-red-dark', dot: 'bg-red-dark', badge: 'bg-red-dark text-white', icon: 'megaphone' },
  civic: { chip: 'bg-black-4/50 text-black', rail: 'border-l-black-3', top: 'border-t-black-3', dot: 'bg-black-3', badge: 'bg-black-4/60 text-black', icon: 'building' },
  training: { chip: 'bg-black-4/50 text-black', rail: 'border-l-black-2', top: 'border-t-black-2', dot: 'bg-black-2', badge: 'bg-mist text-black', icon: 'book' },
  other: { chip: 'bg-black-4/50 text-black', rail: 'border-l-black-4', top: 'border-t-black-4', dot: 'bg-black-4', badge: 'bg-mist text-black', icon: 'calendar' },
};
