/**
 * WordPress dependencies
 */
import { Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { media as mediaIcon, cog } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { store as interfaceStore, PinnedItems } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import type { Media } from '@wordpress/media-editor';

interface HeaderProps {
	postId: string;
}

export default function Header( { postId }: HeaderProps ) {
	const { media, hasEdits, isSaving, isSidebarOpen } = useSelect(
		( select ) => {
			const editedMedia = select( coreStore ).getEditedEntityRecord(
				'postType',
				'attachment',
				postId
			);
			return {
				media: editedMedia as Media,
				hasEdits: select( coreStore ).hasEditsForEntityRecord(
					'postType',
					'attachment',
					postId
				),
				isSaving: select( coreStore ).isSavingEntityRecord(
					'postType',
					'attachment',
					postId
				),
				isSidebarOpen:
					select( interfaceStore ).getActiveComplementaryArea(
						'core/media-editor'
					) === 'media-editor-sidebar',
			};
		},
		[ postId ]
	);

	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );

	const handleSave = async () => {
		try {
			await saveEditedEntityRecord( 'postType', 'attachment', postId );
			createSuccessNotice( __( 'Media updated.' ), {
				type: 'snackbar',
			} );
		} catch ( error ) {
			createErrorNotice( __( 'Failed to save media.' ), {
				type: 'snackbar',
			} );
		}
	};

	const handleToggleSidebar = () => {
		if ( isSidebarOpen ) {
			disableComplementaryArea( 'core/media-editor' );
		} else {
			enableComplementaryArea(
				'core/media-editor',
				'media-editor-sidebar'
			);
		}
	};

	const title = media?.title?.rendered || media?.title?.raw || __( 'Media' );

	return (
		<div className="media-editor-header">
			<div className="media-editor-header__document-bar">
				<Icon icon={ mediaIcon } />
				<h1 className="media-editor-header__title">{ title }</h1>
			</div>
			<div className="media-editor-header__actions">
				<PinnedItems.Slot scope="core/media-editor" />
				<Button
					icon={ cog }
					label={ __( 'Settings' ) }
					size="compact"
					onClick={ handleToggleSidebar }
					isPressed={ isSidebarOpen }
					aria-expanded={ isSidebarOpen }
				/>
				<Button
					variant="primary"
					size="compact"
					onClick={ handleSave }
					disabled={ ! hasEdits || isSaving }
					isBusy={ isSaving }
				>
					{ isSaving ? __( 'Saving' ) : __( 'Save' ) }
				</Button>
			</div>
		</div>
	);
}
