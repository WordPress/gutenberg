import type { ForwardedRef } from 'react';
import deprecated from '@wordpress/deprecated';
import type { WordPressComponentProps } from '../context';
import { contextConnect } from '../context';
import { UnconnectedScrollable } from './component';
import type { ScrollableProps } from './types';

function UnconnectedDeprecatedScrollable(
	props: WordPressComponentProps< ScrollableProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	deprecated( 'wp.components.__experimentalScrollable', {
		since: '7.2',
		version: '7.4',
	} );

	// Nested <Scrollable /> would contextConnect twice.
	return UnconnectedScrollable( props, forwardedRef );
}

/**
 * `Scrollable` is a layout component that puts content in a scrollable
 * container.
 *
 * This component is deprecated. Write your own CSS instead.
 *
 * @deprecated
 *
 * ```jsx
 * import { __experimentalScrollable as Scrollable } from '@wordpress/components';
 *
 * function Example() {
 * 	return (
 * 		<Scrollable style={ { maxHeight: 200 } }>
 * 			<div style={ { height: 500 } }>...</div>
 * 		</Scrollable>
 * 	);
 * }
 * ```
 */
const DeprecatedScrollable = contextConnect(
	UnconnectedDeprecatedScrollable,
	'Scrollable'
);

export default DeprecatedScrollable;
