/**
 * Explorations system for Content Guidelines.
 *
 * Allows toggling between different UI variations via an admin bar dropdown.
 * Each exploration is a full copy of the baseline UI that can be modified independently.
 */

export const EXPLORATION_STORAGE_KEY = 'content-guidelines-exploration';

export interface Exploration {
	key: string;
	label: string;
}

export const EXPLORATIONS: Exploration[] = [
	{ key: 'A', label: 'Option A (Per-Section)' },
	{ key: 'B', label: 'Option B (Suggest All)' },
	{ key: 'C', label: 'Option C (Proactive)' },
];
