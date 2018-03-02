/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import Dashicon from '../dashicon';

class DropZone extends Component {
	constructor() {
		super( ...arguments );

		this.setZoneNode = this.setZoneNode.bind( this );
		this.onDrop = this.onDrop.bind( this );
		this.onFilesDrop = this.onFilesDrop.bind( this );
		this.onHTMLDrop = this.onHTMLDrop.bind( this );

		this.state = {
			isDraggingOverDocument: false,
			isDraggingOverElement: false,
			position: null,
		};
	}

	componentDidMount() {
		this.context.dropzones.add( {
			element: this.zone,
			updateState: this.setState.bind( this ),
			onDrop: this.onDrop,
			onFilesDrop: this.onFilesDrop,
			onHTMLDrop: this.onHTMLDrop,
		} );
	}

	componentWillUnmount() {
		this.context.dropzones.remove( this.zone );
	}

	onDrop() {
		if ( this.props.onDrop ) {
			this.props.onDrop( ...arguments );
		}
	}

	onFilesDrop() {
		if ( this.props.onFilesDrop ) {
			this.props.onFilesDrop( ...arguments );
		}
	}

	onHTMLDrop() {
		if ( this.props.onHTMLDrop ) {
			this.props.onHTMLDrop( ...arguments );
		}
	}

	setZoneNode( node ) {
		this.zone = node;
	}

	render() {
		const { className, label } = this.props;
		const { isDraggingOverDocument, isDraggingOverElement, position } = this.state;
		const classes = classnames( 'components-drop-zone', className, {
			'is-active': isDraggingOverDocument || isDraggingOverElement,
			'is-dragging-over-document': isDraggingOverDocument,
			'is-dragging-over-element': isDraggingOverElement,
			'is-close-to-top': position && position.y === 'top',
			'is-close-to-bottom': position && position.y === 'bottom',
			'is-close-to-left': position && position.x === 'left',
			'is-close-to-right': position && position.x === 'right',
		} );

		return (
			<div ref={ this.setZoneNode } className={ classes }>
				<div className="components-drop-zone__content">
					{ [
						<Dashicon
							key="icon"
							icon="upload"
							size="40"
							className="components-drop-zone__content-icon"
						/>,
						<span
							key="text"
							className="components-drop-zone__content-text"
						>
							{ label ? label : __( 'Drop files to upload' ) }
						</span>,
					] }
				</div>
			</div>
		);
	}
}

DropZone.contextTypes = {
	dropzones: noop,
};

export default DropZone;

