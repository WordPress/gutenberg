/**
 * Internal dependencies
 */
import type { TypeProvidedProps } from '../types/private';

export default function normalizeField< Item >(): TypeProvidedProps< Item > {
	return {
		type: 'media',
		render: () => null,
		Edit: null,
		sort: () => 0,
		isValid: {
			elements: true,
			custom: () => null,
		},
		enableSorting: false,
		enableGlobalSearch: false,
		defaultOperators: [],
		validOperators: [],
		getFormat: () => ( {} ),
	};
}
