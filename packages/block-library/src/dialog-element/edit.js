/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Icon, close } from '@wordpress/icons';
import {
	useRef,
	useEffect,
	useState,
	useMemo,
	useCallback,
} from '@wordpress/element';
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
				dialogElementRef.current.showModal();
			} else if ( ! isOpen && dialogElementRef.current.open ) {
				dialogElementRef.current.close();
			}
		}
	}, [ isOpen ] );

	/**
	 * Finalize the close operation - update block attributes and select parent.
	 */
	const finalizeClose = useCallback( () => {
		if ( dialogClientId ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( dialogClientId, {
				editorIsDialogOpen: false,
			} );
		}
		setShowClosingAnimation( false );
		selectBlock( rootClientId );
	}, [
		dialogClientId,
		rootClientId,
		selectBlock,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

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

	const closeDialog = useCallback( () => {
		// Check if user prefers reduced motion - if so, close immediately
		const prefersReducedMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)'
		).matches;

		if ( prefersReducedMotion ) {
			finalizeClose();
			return;
		}

		// Start closing animation
		setShowClosingAnimation( true );

		// Wait for the CSS animation to complete before closing.
		// Using animationend ensures we close at the exact moment
		// the animation finishes, avoiding timing mismatches.
		const dialogElement = dialogElementRef.current;
		if ( ! dialogElement ) {
			finalizeClose();
			return;
		}

		const onAnimationEnd = ( event ) => {
			// Only handle our closing animation
			if ( event.animationName !== 'turn-off-visibility' ) {
				return;
			}
			dialogElement.removeEventListener( 'animationend', onAnimationEnd );
			finalizeClose();
		};

		dialogElement.addEventListener( 'animationend', onAnimationEnd );
	}, [ finalizeClose ] );
	const onEscHandler = ( e ) => {
		e.preventDefault();
		closeDialog();
	};
	const onBackdropClick = ( event ) => {
		// Only close if clicking directly on the dialog backdrop, not its children
		if ( event.target === event.currentTarget ) {
			closeDialog();
		}
	};

	// Build CSS custom properties for backdrop color
	const customColorStyles = useMemo( () => {
		const styles = {};
		const backdropColorValue =
			backdropColor?.color || attributes.customBackdropColor;

		if ( backdropColorValue ) {
			styles[ '--wp--style--dialog-backdrop-color' ] = backdropColorValue;
		}

		return styles;
	}, [ backdropColor?.color, attributes.customBackdropColor ] );

	const blockProps = useBlockProps( {
		ref: dialogElementRef,
		className: clsx( {
			active: isOpen && ! showClosingAnimation,
			'show-closing-animation': showClosingAnimation,
		} ),
		style: customColorStyles,
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
			{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- Keyboard support provided via KeyboardShortcuts ESC handler above */ }
			<dialog { ...blockProps } onClick={ onBackdropClick }>
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
					<Icon icon={ close } />
				</button>
				<div { ...innerBlocksProps } />
			</dialog>
		</KeyboardShortcuts>
	);
}

export default withColors( { backdropColor: 'backdrop-color' } )( Edit );
