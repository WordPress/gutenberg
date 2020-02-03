/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { RovingTabIndexProvider } from './context';

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/components/src/roving-tab-index/README.md
 */
export default function RovingTabIndex( { children } ) {
	const [ providerValue, setProviderValue ] = useState( {
		lastFocusedElement: undefined,
		setLastFocusedElement: ( element ) =>
			setProviderValue( {
				...providerValue,
				lastFocusedElement: element,
			} ),
	} );

	return (
		<RovingTabIndexProvider value={ providerValue }>
			{ children }
		</RovingTabIndexProvider>
	);
}

export { default as RovingTabIndexItem } from './item';
