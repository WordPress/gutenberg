/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Icon, cancelCircleFilled } from '@wordpress/icons';
import { useRef, useEffect, useState } from '@wordpress/element';
import {
	useBlockProps,
	useInnerBlocksProps,
	withColors,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { KeyboardShortcuts } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Toolbar, InspectorPanel } from './controls';
import StyleEngine from './style-engine';

/**
 * Animation duration in milliseconds. Must match the CSS animation duration
 * defined in style.scss (turn-on-visibility: 0.4s, turn-off-visibility: 0.35s).
 */
const ANIMATION_DURATION = 400;

function Edit( {
	attributes,
	setAttributes,
	context,
	clientId,
	backdropColor,
	setBackdropColor,
} ) {
	const {
		selectBlock,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	// Get isOpen from context
	const isOpen = context[ 'core/dialog-isDialogOpen' ] ?? false;

	// Local state for closing animation
	const [ showClosingAnimation, setShowClosingAnimation ] = useState( false );
	const closeTimeoutRef = useRef( null );

	const { rootClientId, dialogClientId } = useSelect(
		( select ) => {
			return {
				rootClientId:
					select( blockEditorStore ).getBlockRootClientId( clientId ),
				dialogClientId:
					select( blockEditorStore ).getBlockRootClientId( clientId ),
			};
		},
		[ clientId ]
	);

	/**
	 * Setup ref for the dialog.
	 */
	const dialogElementRef = useRef( null );

	// Sync DOM state with context state
	useEffect( () => {
		if ( dialogElementRef.current ) {
			if ( isOpen && ! dialogElementRef.current.open ) {
				// Reset closing animation when opening
				setShowClosingAnimation( false );
				if ( closeTimeoutRef.current ) {
					clearTimeout( closeTimeoutRef.current );
					closeTimeoutRef.current = null;
				}
				dialogElementRef.current.showModal();
			} else if ( ! isOpen && dialogElementRef.current.open ) {
				dialogElementRef.current.close();
			}
		}
	}, [ isOpen ] );

	// Cleanup timeout on unmount
	useEffect( () => {
		return () => {
			if ( closeTimeoutRef.current ) {
				clearTimeout( closeTimeoutRef.current );
			}
		};
	}, [] );

	/**
	 * Helper functions:
	 */
	const openDialog = () => {
		if ( dialogClientId ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( dialogClientId, {
				editorIsDialogOpen: true,
			} );
		}
	};
	const closeDialog = () => {
		// Clear any existing timeout before setting a new one
		if ( closeTimeoutRef.current ) {
			clearTimeout( closeTimeoutRef.current );
		}
		// Start closing animation
		setShowClosingAnimation( true );
		// After animation completes, actually close
		closeTimeoutRef.current = setTimeout( () => {
			if ( dialogClientId ) {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( dialogClientId, {
					editorIsDialogOpen: false,
				} );
			}
			setShowClosingAnimation( false );
			selectBlock( rootClientId );
			closeTimeoutRef.current = null;
		}, ANIMATION_DURATION );
	};
	const onEscHandler = ( e ) => {
		e.preventDefault();
		closeDialog();
	};

	const blockProps = useBlockProps( {
		ref: dialogElementRef,
		className: clsx( {
			active: isOpen && ! showClosingAnimation,
			'show-closing-animation': showClosingAnimation,
		} ),
		role: 'dialog',
		'aria-modal': 'true',
		'aria-labelledby': '',
	} );

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-dialog-element__inner',
		},
		{
			templateLock: false,
			__experimentalCaptureToolbars: true,
		}
	);

	return (
		<KeyboardShortcuts
			bindGlobal
			shortcuts={ {
				esc: onEscHandler,
			} }
		>
			<dialog { ...blockProps }>
				<StyleEngine attributes={ attributes } clientId={ clientId } />
				<InspectorPanel
					colors={ {
						backdropColor,
						setBackdropColor,
					} }
					openDialog={ openDialog }
					closeDialog={ closeDialog }
					clientId={ clientId }
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
				<Toolbar
					openDialog={ openDialog }
					closeDialog={ closeDialog }
					isOpen={ isOpen }
					clientId={ clientId }
					attributes={ attributes }
				/>
				<button
					className="wp-block-dialog-element__close-button"
					type="button"
					aria-label="Close dialog"
					onClick={ () => closeDialog() }
				>
					<Icon icon={ cancelCircleFilled } />
				</button>
				<div { ...innerBlocksProps } />
			</dialog>
		</KeyboardShortcuts>
	);
}

export default withColors( { backdropColor: 'backdrop-color' } )( Edit );
