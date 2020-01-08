/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, createRef, useContext, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Dashicon from '../dashicon';
import { DropZoneConsumer, Context } from './provider';

export function useDropZone( { element, onFilesDrop, onHTMLDrop, onDrop, isDisabled } ) {
	const { addDropZone, removeDropZone } = useContext( Context );
	const [ state, setState ] = useState( {
		isDraggingOverDocument: false,
		isDraggingOverElement: false,
		position: null,
		type: null,
	} );

	useEffect( () => {
		if ( ! isDisabled ) {
			const dropZone = {
				element,
				onDrop,
				onFilesDrop,
				onHTMLDrop,
				setState,
			};
			addDropZone( dropZone );
			return () => {
				removeDropZone( dropZone );
			};
		}
	}, [ isDisabled ] );

	const { isDraggingOverDocument, isDraggingOverElement, position, type } = state;
	return classnames( {
		'is-active': ( isDraggingOverDocument || isDraggingOverElement ) && (
			( type === 'file' && onFilesDrop ) ||
			( type === 'html' && onHTMLDrop ) ||
			( type === 'default' && onDrop )
		),
		'is-dragging-over-document': isDraggingOverDocument,
		'is-dragging-over-element': isDraggingOverElement,
		'is-close-to-top': position && position.y === 'top',
		'is-close-to-bottom': position && position.y === 'bottom',
		'is-close-to-left': position && position.x === 'left',
		'is-close-to-right': position && position.x === 'right',
		[ `is-dragging-${ type }` ]: !! type,
	} );
}

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

		this.dropZone = {
			element: createRef(),
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
		this.props.addDropZone( this.dropZone );
	}

	componentWillUnmount() {
		this.props.removeDropZone( this.dropZone );
	}

	render() {
		const { className, label, onFilesDrop, onHTMLDrop, onDrop } = this.props;
		const { isDraggingOverDocument, isDraggingOverElement, position, type } = this.state;
		const classes = classnames( 'components-drop-zone', className, {
			'is-active': ( isDraggingOverDocument || isDraggingOverElement ) && (
				( type === 'file' && onFilesDrop ) ||
				( type === 'html' && onHTMLDrop ) ||
				( type === 'default' && onDrop )
			),
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
			<div ref={ this.dropZone.element } className={ classes }>
				{ children }
			</div>
		);
	}
}

export default DropZone;
