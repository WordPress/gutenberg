/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Dashicon from '../dashicon';
import { DropZoneConsumer } from './provider';

const DropZone = ( props ) => (
	<DropZoneConsumer>
		{ ( { addDropZone, removeDropZone } ) => (
			<DropZoneComponent
				addDropZone={ addDropZone }
				removeDropZone={ removeDropZone }
				{ ...props }
			/>
		) }
	</DropZoneConsumer>
);

class DropZoneComponent extends Component {
	constructor() {
		super( ...arguments );

		this.dropZoneElement = createRef();
		this.dropZone = {
			element: null,
			onDrop: this.props.onDrop,
			onFilesDrop: this.props.onFilesDrop,
			onHTMLDrop: this.props.onHTMLDrop,
			setState: this.setState.bind( this ),
		};
		this.state = {
			isDraggingOverDocument: false,
			isDraggingOverElement: false,
			position: null,
			type: null,
		};
	}

	componentDidMount() {
		// Set element after the component has a node assigned in the DOM
		this.dropZone.element = this.dropZoneElement.current;
		this.props.addDropZone( this.dropZone );
	}

	componentWillUnmount() {
		this.props.removeDropZone( this.dropZone );
	}

	render() {
		const { className, label } = this.props;
		const { isDraggingOverDocument, isDraggingOverElement, position, type } = this.state;
		const classes = classnames( 'components-drop-zone', className, {
			'is-active': isDraggingOverDocument || isDraggingOverElement,
			'is-dragging-over-document': isDraggingOverDocument,
			'is-dragging-over-element': isDraggingOverElement,
			'is-close-to-top': position && position.y === 'top',
			'is-close-to-bottom': position && position.y === 'bottom',
			'is-close-to-left': position && position.x === 'left',
			'is-close-to-right': position && position.x === 'right',
			[ `is-dragging-${ type }` ]: !! type,
		} );

		let children;
		if ( isDraggingOverElement ) {
			children = (
				<div className="components-drop-zone__content">
					<Dashicon
						icon="upload"
						size="40"
						className="components-drop-zone__content-icon"
					/>
					<span className="components-drop-zone__content-text">
						{ label ? label : __( 'Drop files to upload' ) }
					</span>
				</div>
			);
		}

		return (
			<div ref={ this.dropZoneElement } className={ classes }>
				{ children }
			</div>
		);
	}
}

export default DropZone;
