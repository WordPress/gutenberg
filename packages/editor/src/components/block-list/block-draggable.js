/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';
import { Component } from '@wordpress/element';

class BlockDraggable extends Component {
	render() {
		const { rootClientId, index, clientId, layout, isDragging, ...props } = this.props;
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
				<div className="editor-block-list__block-draggable-inner"></div>
			</Draggable>
		);
	}
}

export default BlockDraggable;
