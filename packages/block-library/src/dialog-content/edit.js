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
	useCallback,
} from '@wordpress/element';
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { KeyboardShortcuts } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Toolbar } from './controls';

function Edit( {
	attributes,
	setAttributes,
	context,
	clientId,
} ) {
	const {
		selectBlock,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	const isOpen = context[ 'core/dialog-isDialogOpen' ] ?? false;

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

	const dialogElementRef = useRef( null );

	useEffect( () => {
		if ( dialogElementRef.current ) {
			if ( isOpen && ! dialogElementRef.current.open ) {
				setShowClosingAnimation( false );
				dialogElementRef.current.showModal();
			} else if ( ! isOpen && dialogElementRef.current.open ) {
				dialogElementRef.current.close();
			}
		}
	}, [ isOpen ] );

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

	const openDialog = () => {
		if ( dialogClientId ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( dialogClientId, {
				editorIsDialogOpen: true,
			} );
		}
	};

	const closeDialog = useCallback( () => {
		const prefersReducedMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)'
		).matches;

		if ( prefersReducedMotion ) {
			finalizeClose();
			return;
		}

		setShowClosingAnimation( true );

		const dialogElement = dialogElementRef.current;
		if ( ! dialogElement ) {
			finalizeClose();
			return;
		}

		const onAnimationEnd = ( event ) => {
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
		if ( event.target === event.currentTarget ) {
			closeDialog();
		}
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
			className: 'wp-block-dialog-content__inner',
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
				<Toolbar
					openDialog={ openDialog }
					closeDialog={ closeDialog }
					isOpen={ isOpen }
					clientId={ clientId }
					attributes={ attributes }
				/>
				<button
					className="wp-block-dialog-content__close-button"
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

export default Edit;
