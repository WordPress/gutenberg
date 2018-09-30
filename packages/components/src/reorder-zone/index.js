/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

class ReorderZone extends Component {
	constructor( props ) {
		super( props );

		this.handleDrop = this.handleDrop.bind( this );
		this.handleDragEnter = this.handleDragEnter.bind( this );
		this.handleDragLeave = this.handleDragLeave.bind( this );
	}

	handleDrop( event ) {
		event.preventDefault();
		const { handleDrop, index } = this.props;
		this.handleDragLeave( event );
		const transferData = JSON.parse( event.dataTransfer.getData( 'text' ) );
		handleDrop( transferData.oldIndex, index );
	}

	handleDragEnter( event ) {
		event.target.classList.add( 'hovering' );
	}

	handleDragLeave( event ) {
		event.target.classList.remove( 'hovering' );
	}

	render() {
		const { last } = this.props;
		const className = classnames( 'block-gallery__reorder-zone', { last } );
		return (
			<div className={ className } onDrop={ this.handleDrop } onDragEnter={ this.handleDragEnter }
				onDragLeave={ this.handleDragLeave }>
			</div>
		);
	}
}

export default ReorderZone;
