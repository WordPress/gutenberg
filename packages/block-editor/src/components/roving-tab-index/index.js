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
export default function RovingTabIndexContainer( { children, tagName: TagName, ...props } ) {
	const [ lastFocusedElement, setLastFocusedElement ] = useState();

	return (
		<RovingTabIndexProvider value={ lastFocusedElement }>
			<TagName onFocus={ ( event ) => setLastFocusedElement( event.target ) } { ...props }>
				{ children }
			</TagName>
		</RovingTabIndexProvider>
	);
}

export { RovingTabIndexItem } from './item';
