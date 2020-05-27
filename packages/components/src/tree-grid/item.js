/**
 * External dependencies
 */
import { unstable_CompositeItem as CompositeItem } from 'reakit/Composite';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useTreeGridContext } from './context';

function TreeGridItem( props, ref ) {
	const treeGridState = useTreeGridContext();

	return <CompositeItem { ...treeGridState } ref={ ref } { ...props } />;
}

export default forwardRef( TreeGridItem );
