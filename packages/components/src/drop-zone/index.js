/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext, useEffect, useState, useRef } from '@wordpress/element';
import { upload, Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { DropZoneConsumer, Context } from './provider';

export function useDropZone( {
	element,
	onFilesDrop,
	onHTMLDrop,
	onDrop,
	isDisabled,
	withPosition,
} ) {
	const { addDropZone, removeDropZone } = useContext( Context );
	const [ state, setState ] = useState( {
		isDraggingOverDocument: false,
		isDraggingOverElement: false,
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
				withPosition,
			};
			addDropZone( dropZone );
			return () => {
				removeDropZone( dropZone );
			};
		}
	}, [ isDisabled, onDrop, onFilesDrop, onHTMLDrop, withPosition ] );

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
	const { isDraggingOverDocument, isDraggingOverElement, type } = useDropZone(
		{
			element,
			onFilesDrop,
			onHTMLDrop,
			onDrop,
		}
	);

	let children;

	if ( isDraggingOverElement ) {
		children = (
			<div className="components-drop-zone__content">
				<Icon
					icon={ upload }
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
		'is-active':
			( isDraggingOverDocument || isDraggingOverElement ) &&
			( ( type === 'file' && onFilesDrop ) ||
				( type === 'html' && onHTMLDrop ) ||
				( type === 'default' && onDrop ) ),
		'is-dragging-over-document': isDraggingOverDocument,
		'is-dragging-over-element': isDraggingOverElement,
		[ `is-dragging-${ type }` ]: !! type,
	} );

	return (
		<div ref={ element } className={ classes }>
			{ children }
		</div>
	);
}

export default DropZone;
