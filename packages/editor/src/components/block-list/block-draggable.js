/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withDraggable } from '@wordpress/components';

class BlockDraggable extends Component {
	render() {
		const { isDragging, onDragStart, onDragEnd } = this.props;
		const className = classnames( 'editor-block-list__block-draggable', {
			'is-visible': isDragging,
		} );

		return (
			<div
				className={ className }
				onDragStart={ onDragStart }
				onDragEnd={ onDragEnd }
				draggable
			>
				<div className="editor-block-list__block-draggable-inner"></div>
			</div>
		);
	}
}

export default withDraggable( BlockDraggable );
