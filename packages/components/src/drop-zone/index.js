/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext, useEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Dashicon from '../dashicon';
import { DropZoneConsumer, Context } from './provider';

export function useDropZone( {
	element,
	onFilesDrop,
	onHTMLDrop,
	onDrop,
	isDisabled,
	withExactPosition,
} ) {
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
				withExactPosition,
			};
			addDropZone( dropZone );
			return () => {
				removeDropZone( dropZone );
			};
		}
	}, [ isDisabled, onDrop, onFilesDrop, onHTMLDrop, withExactPosition ] );

	return state;
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

function DropZoneComponent( {
	className,
	label,
	onFilesDrop,
	onHTMLDrop,
	onDrop,
} ) {
	const element = useRef();
	const {
		isDraggingOverDocument,
		isDraggingOverElement,
		position,
		type,
	} = useDropZone( { element, onFilesDrop, onHTMLDrop, onDrop } );

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

	return (
		<div ref={ element } className={ classes }>
			{ children }
		</div>
	);
}

export default DropZone;
