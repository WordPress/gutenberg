export type ComponentStatus =
	| 'stable'
	| 'use-with-caution'
	| 'not-recommended'
	| 'unaudited';

export const statuses: {
	value: ComponentStatus;
	label: string;
	icon: string;
}[] = [
	{
		value: 'stable',
		label: 'Stable',
		icon: '✅',
	},
	{
		value: 'use-with-caution',
		label: 'Use with caution',
		icon: '⚠️',
	},
	{
		value: 'not-recommended',
		label: 'Not recommended',
		icon: '🚫',
	},
	{
		value: 'unaudited',
		label: 'Unaudited',
		icon: '❓',
	},
];
