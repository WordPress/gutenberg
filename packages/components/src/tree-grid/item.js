/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RovingTabIndexItem from './roving-tab-index-item';

export default forwardRef( function TreeGridItem(
	{ children, ...props },
	ref
) {
	return (
		<RovingTabIndexItem ref={ ref } { ...props }>
			{ children }
		</RovingTabIndexItem>
	);
} );
