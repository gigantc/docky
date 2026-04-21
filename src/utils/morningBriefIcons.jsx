import {
  ArrowUpRight,
  Code2,
  Globe2,
  Dribbble,
  Laugh,
  Newspaper,
  Trophy,
  Dumbbell,
  Volleyball,
  CircleDot,
  Sparkles,
  Flame,
  Zap,
} from 'lucide-react'

const ICONS = {
  globe: Globe2,
  world: Globe2,
  news: Newspaper,
  code: Code2,
  ai: Sparkles,
  trend: ArrowUpRight,
  'trend-up': ArrowUpRight,
  meme: Laugh,
  laugh: Laugh,
  sports: Trophy,
  football: Trophy,
  basketball: Dribbble,
  baseball: CircleDot,
  fight: Dumbbell,
  hot: Flame,
  alert: Zap,
}

export const MORNING_BRIEF_ICON_KEYS = Object.keys(ICONS).sort()

export function getMorningBriefIcon(iconKey) {
  if (!iconKey) return Newspaper
  return ICONS[iconKey] || Newspaper
}
