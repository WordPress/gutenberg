/**
 * WordPress dependencies
 */
import {
	BlockSettingsMenuControls,
	__unstableBlockSettingsMenuFirstItem as BlockSettingsMenuFirstItem,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { __experimentalText as Text, MenuItem } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function ContentOnlySettingsMenuItems( { clientId } ) {
	const { entity, onNavigateToEntityRecord } = useSelect(
		( select ) => {
			const {
				getBlockEditingMode,
				getBlockParentsByBlockName,
				getSettings,
				getBlockAttributes,
			} = select( blockEditorStore );
			const contentOnly =
				getBlockEditingMode( clientId ) === 'contentOnly';
			if ( ! contentOnly ) return {};
			const patternParent = getBlockParentsByBlockName(
				clientId,
				'core/block',
				true
			)[ 0 ];

			let record;
			if ( patternParent ) {
				record = select( coreStore ).getEntityRecord(
					'postType',
					'wp_block',
					getBlockAttributes( patternParent ).ref
				);
			} else {
				const templateId = select( editorStore ).getCurrentTemplateId();
				if ( templateId ) {
					record = select( coreStore ).getEntityRecord(
						'postType',
						'wp_template',
						templateId
					);
				}
			}
			return {
				entity: record,
				onNavigateToEntityRecord:
					getSettings().onNavigateToEntityRecord,
			};
		},
		[ clientId ]
	);

	if ( ! entity ) return null;

	const isPattern = entity.type === 'wp_block';

	return (
		<>
			<BlockSettingsMenuFirstItem>
				<Text
					variant="muted"
					as="p"
					className="editor-content-only-settings-menu__description"
				>
					{ isPattern
						? sprintf(
								// translators: %s: pattern's title.
								__(
									'This block belongs to "%s". Edit the pattern to move or delete it.'
								),
								entity.title.raw
						  )
						: sprintf(
								// translators: %s: template's title.
								__(
									'This block belongs to "%s". Edit the template to move or delete it.'
								),
								entity.title.rendered
						  ) }
				</Text>
			</BlockSettingsMenuFirstItem>
			<MenuItem
				onClick={ () => {
					onNavigateToEntityRecord( {
						postId: entity.id,
						postType: entity.type,
					} );
				} }
			>
				{ isPattern ? __( 'Edit pattern' ) : __( 'Edit template' ) }
			</MenuItem>
		</>
	);
}

export default function TemplateContentOnlySettingsMenu() {
	return (
		<BlockSettingsMenuControls>
			{ ( { selectedClientIds } ) =>
				selectedClientIds.length === 1 && (
					<ContentOnlySettingsMenuItems
						clientId={ selectedClientIds[ 0 ] }
					/>
				)
			}
		</BlockSettingsMenuControls>
	);
}
