/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Icon, cancelCircleFilled } from '@wordpress/icons';
import { useRef, useEffect } from '@wordpress/element';
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
import { STORE_NAME } from '../dialog/store';

function Edit( {
	attributes,
	setAttributes,
	context,
	clientId,
	className,
	backdropColor,
	setBackdropColor,
} ) {
	const { dialogSize = 'medium', animation = 'fade' } = attributes;
	const { selectBlock } = useDispatch( blockEditorStore );
	const { init, destroy, open, close } = useDispatch( STORE_NAME );

	const { rootClientId, isOpen, isClosingModal } = useSelect(
		( select ) => {
			return {
				rootClientId:
					select( blockEditorStore ).getBlockRootClientId( clientId ),
				isOpen: select( STORE_NAME ).isOpen( clientId ),
				isClosingModal: select( STORE_NAME ).isClosingModal( clientId ),
			};
		},
		[ clientId ]
	);

	/**
	 * Setup state and ref for the dialog.
	 */
	const dialogElementRef = useRef( null );

	// Initialize dialog in store and cleanup on unmount
	useEffect( () => {
		init( clientId );

		return () => {
			destroy( clientId );
		};
	}, [ clientId, init, destroy ] );

	// Sync DOM state with store state
	useEffect( () => {
		if ( dialogElementRef.current ) {
			if ( isOpen && ! dialogElementRef.current.open ) {
				dialogElementRef.current.showModal();
			} else if ( ! isOpen && dialogElementRef.current.open ) {
				dialogElementRef.current.close();
			}
		}
	}, [ isOpen ] );

	/**
	 * Helper functions:
	 */
	const openDialog = () => open( clientId );
	const closeDialog = () => {
		close( clientId );
		selectBlock( rootClientId );
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
					context={ context }
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
					{
						// @TODO We need to probably add a slotfill here for the icon. We should reference the icon library work in Gutenberg to determine if we can hook in to that for this.
					 }
					<Icon icon={ cancelCircleFilled } />
				</button>
				<div { ...innerBlocksProps } />
			</dialog>
		</KeyboardShortcuts>
	);
}

export default withColors( { backdropColor: 'backdrop-color' } )( Edit );
