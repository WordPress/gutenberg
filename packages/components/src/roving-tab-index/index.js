/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { RovingTabIndexProvider } from './context';

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/roving-tab-index/README.md
 */
export default function RovingTabIndexContainer( { children } ) {
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
