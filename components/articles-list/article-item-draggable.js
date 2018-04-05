/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';

function ArticleItemDraggable( { rootUID, index, uid, layout, isDragging, block, ...props } ) {
	const className = classnames( 'components-articles-list-item-draggable', {
		'is-visible': isDragging,
	} );

	const transferData = {
		type: 'block',
		fromIndex: index,
		rootUID,
		uid,
		layout,
		blocks: [ {
			...block
		} ],
	};

	return (
		<Draggable className={ className } transferData={ transferData } { ...props }>
			<div className="components-articles-list-item-draggable-inner"></div>
		</Draggable>
	);
}

export default ArticleItemDraggable;
