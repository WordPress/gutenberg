export type ComponentStatus =
	| 'recommended'
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
	recommended: {
		label: 'Recommended',
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
