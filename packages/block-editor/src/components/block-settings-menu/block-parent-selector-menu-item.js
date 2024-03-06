/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import { useShowHoveredOrFocusedGestures } from '../block-toolbar/utils';
import { store as blockEditorStore } from '../../store';

export default function BlockParentSelectorMenuItem( {
	parentClientId,
	parentBlockType,
} ) {
	const isSmallViewport = useViewportMatch( 'medium', '<' );
	const { selectBlock } = useDispatch( blockEditorStore );

	// Allows highlighting the parent block outline when focusing or hovering
	// the parent block selector within the child.
	const menuItemRef = useRef();
	const gesturesProps = useShowHoveredOrFocusedGestures( {
		ref: menuItemRef,
		highlightParent: true,
	} );

	if ( ! isSmallViewport ) {
		return null;
	}

	return (
		<MenuItem
			{ ...gesturesProps }
			ref={ menuItemRef }
			icon={ <BlockIcon icon={ parentBlockType.icon } /> }
			onClick={ () => selectBlock( parentClientId ) }
		>
			{ sprintf(
				/* translators: %s: Name of the block's parent. */
				__( 'Select parent block (%s)' ),
				parentBlockType.title
			) }
		</MenuItem>
	);
}
