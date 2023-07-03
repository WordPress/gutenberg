/**
 * External dependencies
 */
import classnames from 'classnames';

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
import type { DropType, DropZoneProps } from './types';
import type { WordPressComponentProps } from '../ui/context';

/**
 * `DropZone` is a component creating a drop zone area taking the full size of its parent element. It supports dropping files, HTML content or any other HTML drop event.
 *
 * ```jsx
 * import { DropZone } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyDropZone = () => {
 *   const [ hasDropped, setHasDropped ] = useState( false );
 *
 *   return (
 *     <div>
 *       { hasDropped ? 'Dropped!' : 'Drop something here' }
 *       <DropZone
 *         onFilesDrop={ () => setHasDropped( true ) }
 *         onHTMLDrop={ () => setHasDropped( true ) }
 *         onDrop={ () => setHasDropped( true ) }
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function DropZoneComponent( {
	className,
	label,
	onFilesDrop,
	onHTMLDrop,
	onDrop,
	...restProps
}: WordPressComponentProps< DropZoneProps, 'div', false > ) {
	const [ isDraggingOverDocument, setIsDraggingOverDocument ] =
		useState< boolean >();
	const [ isDraggingOverElement, setIsDraggingOverElement ] =
		useState< boolean >();
	const [ type, setType ] = useState< DropType >();
	const ref = useDropZone( {
		onDrop( event ) {
			const files = event.dataTransfer
				? getFilesFromDataTransfer( event.dataTransfer )
				: [];
			const html = event.dataTransfer?.getData( 'text/html' );

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

			let _type: DropType = 'default';

			/**
			 * From Windows Chrome 96, the `event.dataTransfer` returns both file object and HTML.
			 * The order of the checks is important to recognise the HTML drop.
			 */
			if ( event.dataTransfer?.types.includes( 'text/html' ) ) {
				_type = 'html';
			} else if (
				// Check for the types because sometimes the files themselves
				// are only available on drop.
				event.dataTransfer?.types.includes( 'Files' ) ||
				( event.dataTransfer
					? getFilesFromDataTransfer( event.dataTransfer )
					: []
				).length > 0
			) {
				_type = 'file';
			}

			setType( _type );
		},
		onDragEnd() {
			setIsDraggingOverDocument( false );
			setType( undefined );
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
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: {
				type: 'tween',
				duration: 0.2,
				delay: 0,
				delayChildren: 0.1,
			},
		},
		exit: {
			opacity: 0,
			transition: {
				duration: 0.2,
				delayChildren: 0,
			},
		},
	};

	const foreground = {
		hidden: { opacity: 0, scale: 0.9 },
		show: {
			opacity: 1,
			scale: 1,
			transition: {
				duration: 0.1,
			},
		},
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
				// Without this, when this div is shown,
				// Safari calls a onDropZoneLeave causing a loop because of this bug
				// https://bugs.webkit.org/show_bug.cgi?id=66547
				style={ { pointerEvents: 'none' } }
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
		<div { ...restProps } ref={ ref } className={ classes }>
			{ disableMotion ? (
				children
			) : (
				<AnimatePresence>{ children }</AnimatePresence>
			) }
		</div>
	);
}

export default DropZoneComponent;
