/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { focus } from '@wordpress/dom';
import { useReducer, useRef, useEffect } from '@wordpress/element';
import { lock } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockLockModal from './modal';
import useBlockLock from './use-block-lock';

export default function BlockLockToolbar( { clientId, wrapperRef } ) {
	const { canEdit, canMove, canRemove, canLock } = useBlockLock( clientId );

	const [ isModalOpen, toggleModal ] = useReducer(
		( isActive ) => ! isActive,
		false
	);

	const lockButtonRef = useRef( null );
	const isFirstRender = useRef( true );

	const shouldHideBlockLockUI =
		! canLock || ( canEdit && canMove && canRemove );

	// Restore focus manually on the first focusable element in the toolbar
	// when the block lock modal is closed and the block is not locked anymore.
	// See https://github.com/WordPress/gutenberg/issues/51447
	useEffect( () => {
		if ( isFirstRender.current ) {
			isFirstRender.current = false;
			return;
		}

		if ( ! isModalOpen && shouldHideBlockLockUI ) {
			focus.focusable
				.find( wrapperRef.current, {
					sequential: false,
				} )
				.find(
					( element ) =>
						element.tagName === 'BUTTON' &&
						element !== lockButtonRef.current
				)
				?.focus();
		}
		// wrapperRef is a reference object and should be stable
	}, [ isModalOpen, shouldHideBlockLockUI, wrapperRef ] );

	if ( shouldHideBlockLockUI ) {
		return null;
	}

	return (
		<>
			<ToolbarGroup className="block-editor-block-lock-toolbar">
				<ToolbarButton
					icon={ lock }
					label={ __( 'Unlock' ) }
					onClick={ toggleModal }
					ref={ lockButtonRef }
				/>
			</ToolbarGroup>
			{ isModalOpen && (
				<BlockLockModal clientId={ clientId } onClose={ toggleModal } />
			) }
		</>
	);
}
