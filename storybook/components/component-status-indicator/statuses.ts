export type ComponentStatus =
	| 'stable'
	| 'use-with-caution'
	| 'not-recommended'
	| 'unaudited';

export const statuses: Record<
	ComponentStatus,
	{
		label: string;
		icon: string;
	}
> = {
	stable: {
		label: 'Stable',
		icon: '✅',
	},
	'use-with-caution': {
		label: 'Use with caution',
		icon: '⚠️',
	},
	'not-recommended': {
		label: 'Not recommended',
		icon: '🚫',
	},
	unaudited: {
		label: 'Unaudited',
		icon: '❓',
	},
};
