/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { seen, unseen } from '@wordpress/icons';
import { useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import BlockVisibilityModal from './modal';
import useBlockVisibility from './use-block-visibility';
import { VIEWPORT_LABELS } from './utils';

export default function BlockVisibilityMenuItem( { clientIds } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const {
		blocks,
		isHidden,
		viewportType,
		responsiveEditing,
		toggleVisibility,
	} = useBlockVisibility( clientIds );

	const listViewShortcut = useSelect( ( select ) => {
		return select( keyboardShortcutsStore ).getShortcutRepresentation(
			'core/editor/toggle-list-view'
		);
	}, [] );

	const handleToggle = () => {
		toggleVisibility();

		// Show notice when hiding
		if ( ! isHidden ) {
			const viewportLabel = VIEWPORT_LABELS[ viewportType ];
			const count = blocks.length;

			let message;
			if ( responsiveEditing ) {
				message = sprintf(
					/* translators: 1: Viewport name, 2: List View shortcut. */
					_n(
						'Block hidden on %1$s. Access it via List View (%2$s).',
						'Blocks hidden on %1$s. Access them via List View (%2$s).',
						count
					),
					viewportLabel,
					listViewShortcut
				);
			} else {
				message = sprintf(
					/* translators: %s: List View shortcut. */
					_n(
						'Block hidden. Access it via List View (%s).',
						'Blocks hidden. Access them via List View (%s).',
						count
					),
					listViewShortcut
				);
			}

			createSuccessNotice( message, {
				id: 'block-visibility-hidden',
				type: 'snackbar',
			} );
		}
	};

	const handleClick = () => {
		if ( responsiveEditing ) {
			handleToggle();
		} else {
			setIsModalOpen( true );
		}
	};

	let menuLabel;
	if ( responsiveEditing ) {
		const labelTemplate = isHidden
			? /* translators: %s: Viewport name (Desktop, Tablet, or Mobile) */
			  __( 'Show on %s' )
			: /* translators: %s: Viewport name (Desktop, Tablet, or Mobile) */
			  __( 'Hide on %s' );
		menuLabel = sprintf( labelTemplate, VIEWPORT_LABELS[ viewportType ] );
	} else {
		menuLabel = isHidden ? __( 'Show' ) : __( 'Hide' );
	}

	return (
		<>
			<MenuItem
				icon={ isHidden ? seen : unseen }
				onClick={ handleClick }
				aria-expanded={ ! responsiveEditing ? isModalOpen : undefined }
				aria-haspopup={ ! responsiveEditing ? 'dialog' : undefined }
			>
				{ menuLabel }
			</MenuItem>
			{ isModalOpen && (
				<BlockVisibilityModal
					clientId={ clientIds[ 0 ] }
					onClose={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}
