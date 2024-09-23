/**
 * WordPress dependencies
 */
import {
	BlockSettingsMenuControls,
	__unstableBlockSettingsMenuFirstItem as BlockSettingsMenuFirstItem,
	store as blockEditorStore,
	useBlockDisplayInformation,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { __experimentalText as Text, MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

function ContentOnlySettingsMenuItems( { clientId, onClose } ) {
	const { entity, onNavigateToEntityRecord, canEditTemplates } = useSelect(
		( select ) => {
			const {
				getBlockParentsByBlockName,
				getSettings,
				getBlockAttributes,
			} = unlock( select( blockEditorStore ) );
			const patternParent = getBlockParentsByBlockName(
				clientId,
				'core/block',
				true
			)[ 0 ];

			const _canEditTemplates = select( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: 'wp_template',
			} );
			return {
				canEditTemplates: _canEditTemplates,
				entity: select( coreStore ).getEntityRecord(
					'postType',
					'wp_block',
					getBlockAttributes( patternParent ).ref
				),
				onNavigateToEntityRecord:
					getSettings().onNavigateToEntityRecord,
			};
		},
		[ clientId ]
	);

	if ( ! entity ) {
		return (
			<TemplateLockContentOnlyMenuItems
				clientId={ clientId }
				onClose={ onClose }
			/>
		);
	}

	return (
		<>
			<BlockSettingsMenuFirstItem>
				<MenuItem
					onClick={ () => {
						onNavigateToEntityRecord( {
							postId: entity.id,
							postType: entity.type,
						} );
					} }
					disabled={ ! canEditTemplates }
				>
					{ __( 'Edit pattern' ) }
				</MenuItem>
				<Text
					variant="muted"
					as="p"
					className="editor-content-only-settings-menu__description"
				>
					{ __(
						'Edit the pattern to move, delete, or make further changes to this block.'
					) }
				</Text>
			</BlockSettingsMenuFirstItem>
		</>
	);
}

function TemplateLockContentOnlyMenuItems( { clientId, onClose } ) {
	const { contentLockingParent } = useSelect(
		( select ) => {
			const { getContentLockingParent } = unlock(
				select( blockEditorStore )
			);
			return {
				contentLockingParent: getContentLockingParent( clientId ),
			};
		},
		[ clientId ]
	);
	const blockDisplayInformation =
		useBlockDisplayInformation( contentLockingParent );
	const blockEditorActions = useDispatch( blockEditorStore );
	if ( ! blockDisplayInformation?.title ) {
		return null;
	}

	const { modifyContentLockBlock } = unlock( blockEditorActions );

	return (
		<>
			<BlockSettingsMenuFirstItem>
				<MenuItem
					onClick={ () => {
						modifyContentLockBlock( contentLockingParent );
						onClose();
					} }
				>
					{ _x( 'Unlock', 'Unlock content locked blocks' ) }
				</MenuItem>
			</BlockSettingsMenuFirstItem>
			<Text
				variant="muted"
				as="p"
				className="editor-content-only-settings-menu__description"
			>
				{ __(
					'Temporarily unlock the parent block to edit, delete or make further changes to this block.'
				) }
			</Text>
		</>
	);
}

export default function ContentOnlySettingsMenu() {
	return (
		<BlockSettingsMenuControls>
			{ ( { selectedClientIds, onClose } ) =>
				selectedClientIds.length === 1 && (
					<ContentOnlySettingsMenuItems
						clientId={ selectedClientIds[ 0 ] }
						onClose={ onClose }
					/>
				)
			}
		</BlockSettingsMenuControls>
	);
}
