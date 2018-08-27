/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withDraggable } from '@wordpress/components';
import { withSafeTimeout } from '@wordpress/compose';

class BlockDraggable extends Component {
	constructor( ) {
		super( ...arguments );
		this.onDragStart = this.onDragStart.bind( this );
		this.onDragEnd = this.onDragEnd.bind( this );
	}

	onDragStart( event ) {
		const { elementId, rootClientId, clientId, layout, index, setTimeout, initDragging, onDragStart = noop } = this.props;
		const transferData = {
			type: 'block',
			fromIndex: index,
			rootClientId,
			clientId,
			layout,
		};
		initDragging( elementId, transferData )( event );
		setTimeout( () => onDragStart( event ) );
	}

	onDragEnd( event ) {
		const { onDragEnd = noop } = this.props;
		onDragEnd( event );
	}

	render() {
		const { isDragging } = this.props;
		const className = classnames( 'editor-block-list__block-draggable', {
			'is-visible': isDragging,
		} );

		return (
			<div
				className={ className }
				onDragStart={ this.onDragStart }
				onDragEnd={ this.onDragEnd }
				draggable
			>
				<div className="editor-block-list__block-draggable-inner"></div>
			</div>
		);
	}
}

export default withSafeTimeout( withDraggable( BlockDraggable ) );
