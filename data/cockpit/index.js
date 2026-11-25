// Registered presentation cockpits, by slug. Add a client here and in app/cockpit/<slug>.
import { tataPower } from './tata-power.js';
import { trentar } from './trentar.js';

export const COCKPITS = { [tataPower.slug]: tataPower, [trentar.slug]: trentar };
export const DEFAULT_COCKPIT = tataPower.slug;
export const cockpitPath = (slug) => `/cockpit/${slug}`;
