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
		{ ( context ) => ( <DropZoneComponent context={ context } { ...props } /> ) }
	</DropZoneConsumer>
);

class DropZoneComponent extends Component {
	constructor() {
		super( ...arguments );

		this.ref = createRef();
		this.dropZone = {
			element: null,
			onDrop: this.props.onDrop,
			onFilesDrop: this.props.onFilesDrop,
			onHTMLDrop: this.props.onHTMLDrop,
		};
	}

	componentDidMount() {
		// Set element after the component has a node assigned in the DOM
		this.dropZone.element = this.ref.current;
		this.props.context.addDropZone( this.dropZone );
	}

	componentWillUnmount() {
		this.props.context.removeDropZone( this.dropZone );
	}

	render() {
		const {
			className,
			label,
			context: {
				isDraggingOverDocument,
				isDraggingOverElement,
				position,
				type,
			},
		} = this.props;
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

		return (
			<div ref={ this.ref } className={ classes }>
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

export default DropZone;
