export type ComponentStatus =
	'recommended' | 'use-with-caution' | 'not-recommended' | 'unaudited';

/**
 * The recommendation status of a component, declared per story as
 * `parameters.componentStatus`.
 *
 * `tag` is the tag the status indexer adds to the story index. It lives in the
 * `use-*` namespace, apart from the `status-*` tags that describe the API
 * lifecycle, because the two answer different questions and a component can
 * carry one of each. The tags are spelled out rather than derived, so that
 * `use-with-caution` does not become `use-use-with-caution`.
 */
export const statuses: Record<
	ComponentStatus,
	{
		label: string;
		icon: string;
		tag: string;
	}
> = {
	recommended: {
		label: 'Recommended',
		icon: '✅',
		tag: 'use-recommended',
	},
	'use-with-caution': {
		label: 'Use with caution',
		icon: '⚠️',
		tag: 'use-with-caution',
	},
	'not-recommended': {
		label: 'Not recommended',
		icon: '🚫',
		tag: 'use-not-recommended',
	},
	unaudited: {
		label: 'Unaudited',
		icon: '❓',
		tag: 'use-unaudited',
	},
};
