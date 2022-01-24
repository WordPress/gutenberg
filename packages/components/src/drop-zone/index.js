/**
 * External dependencies
 */
import classnames from 'classnames';
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { upload, Icon } from '@wordpress/icons';
import { getFilesFromDataTransfer } from '@wordpress/dom';
import {
	__experimentalUseDropZone as useDropZone,
	useReducedMotion,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '../animation';

export default function DropZoneComponent( {
	className,
	label,
	onFilesDrop,
	onHTMLDrop,
	onDrop,
} ) {
	const [ isDraggingOverDocument, setIsDraggingOverDocument ] = useState();
	const [ isDraggingOverElement, setIsDraggingOverElement ] = useState();
	const [ type, setType ] = useState();
	const ref = useDropZone( {
		onDrop( event ) {
			const files = getFilesFromDataTransfer( event.dataTransfer );
			const html = event.dataTransfer.getData( 'text/html' );

			/**
			 * From Windows Chrome 96, the `event.dataTransfer` returns both file object and HTML.
			 * The order of the checks is important to recognise the HTML drop.
			 */
			if ( html && onHTMLDrop ) {
				onHTMLDrop( html );
			} else if ( files.length && onFilesDrop ) {
				onFilesDrop( files );
			} else if ( onDrop ) {
				onDrop( event );
			}
		},
		onDragStart( event ) {
			setIsDraggingOverDocument( true );

			let _type = 'default';

			/**
			 * From Windows Chrome 96, the `event.dataTransfer` returns both file object and HTML.
			 * The order of the checks is important to recognise the HTML drop.
			 */
			if ( includes( event.dataTransfer.types, 'text/html' ) ) {
				_type = 'html';
			} else if (
				// Check for the types because sometimes the files themselves
				// are only available on drop.
				includes( event.dataTransfer.types, 'Files' ) ||
				getFilesFromDataTransfer( event.dataTransfer ).length > 0
			) {
				_type = 'file';
			}

			setType( _type );
		},
		onDragEnd() {
			setIsDraggingOverDocument( false );
			setType();
		},
		onDragEnter() {
			setIsDraggingOverElement( true );
		},
		onDragLeave() {
			setIsDraggingOverElement( false );
		},
	} );
	const disableMotion = useReducedMotion();

	let children;

	const backdrop = {
		hidden: { scaleY: 0, opacity: 0 },
		show: {
			scaleY: 1,
			opacity: 1,
			transition: {
				type: 'tween',
				duration: 0.2,
				delay: 0.1,
				delayChildren: 0.2,
			},
		},
		exit: {
			scaleY: 1,
			opacity: 0,
			transition: {
				duration: 0.3,
				delayChildren: 0,
			},
		},
	};

	const foreground = {
		hidden: { opacity: 0, scale: 0.75 },
		show: { opacity: 1, scale: 1 },
		exit: { opacity: 0, scale: 0.9 },
	};

	if ( isDraggingOverElement ) {
		children = (
			<motion.div
				variants={ backdrop }
				initial={ disableMotion ? 'show' : 'hidden' }
				animate="show"
				exit={ disableMotion ? 'show' : 'exit' }
				className="components-drop-zone__content"
			>
				<motion.div variants={ foreground }>
					<Icon
						icon={ upload }
						className="components-drop-zone__content-icon"
					/>
					<span className="components-drop-zone__content-text">
						{ label ? label : __( 'Drop files to upload' ) }
					</span>
				</motion.div>
			</motion.div>
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
		<div ref={ ref } className={ classes }>
			{ disableMotion ? (
				children
			) : (
				<AnimatePresence>{ children }</AnimatePresence>
			) }
		</div>
	);
}
