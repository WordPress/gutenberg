/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';

function BlockDraggable( { rootClientId, index, clientId, layout, isDragging, ...props } ) {
	const className = classnames( 'editor-block-list__block-draggable', {
		'is-visible': isDragging,
	} );

	const transferData = {
		type: 'block',
		fromIndex: index,
		rootClientId,
		clientId,
		layout,
	};

	return (
		<Draggable className={ className } transferData={ transferData } { ...props }>
			{
				/*
				 * TODO: remove the DnD handle text.
				 * We use this to teach the browser to give the div some space.
				 */
			}
			<div className="editor-block-list__block-draggable-inner">DnD handle</div>
		</Draggable>
	);
}

export default BlockDraggable;
