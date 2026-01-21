export type ComponentStatus =
	| 'stable'
	| 'use-with-caution'
	| 'not-recommended'
	| 'unaudited';

export const statuses: {
	value: ComponentStatus;
	label: string;
	description: string;
	icon: string;
}[] = [
	{
		value: 'stable',
		label: 'Stable',
		description: 'This component can be used safely.',
		icon: '✅',
	},
	{
		value: 'use-with-caution',
		label: 'Use with caution',
		description: 'See notes.',
		icon: '⚠️',
	},
	{
		value: 'not-recommended',
		label: 'Not recommended',
		description: 'Do not use this component.',
		icon: '🚫',
	},
	{
		value: 'unaudited',
		label: 'Unaudited',
		description:
			'This component has not been audited yet, and is not necessarily recommended for use.',
		icon: '❓',
	},
];
