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

function Edit( {
	attributes,
	setAttributes,
	context,
	clientId,
	className,
	backdropColor,
	setBackdropColor,
} ) {
	const {
		dialogSize = 'medium',
		animation = 'fade',
		animationDuration = 500,
	} = attributes;
	const {
		selectBlock,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	// Get isOpen from context
	const isOpen = context[ 'core/dialog-isDialogOpen' ] ?? false;

	// Local state for closing animation
	const [ isClosingModal, setIsClosingModal ] = useState( false );

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
	 * Setup state and ref for the dialog.
	 */
	const dialogElementRef = useRef( null );
	const closeTimeoutRef = useRef( null );

	// Sync DOM state with context state
	useEffect( () => {
		if ( dialogElementRef.current ) {
			if ( isOpen && ! dialogElementRef.current.open ) {
				dialogElementRef.current.showModal();
				// Reset closing state when opening and clear any pending close timeout
				setIsClosingModal( false );
				if ( closeTimeoutRef.current ) {
					clearTimeout( closeTimeoutRef.current );
					closeTimeoutRef.current = null;
				}
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
		setIsClosingModal( true );
		// After animation, actually close
		closeTimeoutRef.current = setTimeout( () => {
			if ( dialogClientId ) {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( dialogClientId, {
					editorIsDialogOpen: false,
				} );
			}
			setIsClosingModal( false );
			selectBlock( rootClientId );
			closeTimeoutRef.current = null;
		}, animationDuration );
	};
	const onEscHandler = ( e ) => {
		e.preventDefault();
		closeDialog();
	};

	const blockProps = useBlockProps( {
		ref: dialogElementRef,
		className: clsx( className, {
			'is-size-small': 'small' === dialogSize,
			'is-size-medium': 'medium' === dialogSize,
			'is-size-large': 'large' === dialogSize,
			[ `is-animation-${ animation }` ]: animation,
			'is-closing-modal': isClosingModal,
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
