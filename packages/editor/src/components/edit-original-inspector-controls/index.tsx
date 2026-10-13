import { Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { isTemplatePart } from '@wordpress/blocks';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	// @ts-expect-error No exported types
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { PrivateBlockInspectorEditOriginal } = unlock( blockEditorPrivateApis );

interface EditorSettings {
	onNavigateToEntityRecord?: ( entity: {
		postId: number | string;
		postType: string;
	} ) => void;
}

interface EditOriginalButtonProps {
	/** Client ID of the synced pattern or template part block. */
	clientId: string;
}

/**
 * The block inspector's "Edit original" button for synced patterns and
 * template parts, which opens the entity the block renders.
 */
export default function EditOriginalInspectorControls() {
	return (
		<PrivateBlockInspectorEditOriginal.Fill>
			{ ( { clientId }: EditOriginalButtonProps ) => (
				<EditOriginalButton clientId={ clientId } />
			) }
		</PrivateBlockInspectorEditOriginal.Fill>
	);
}

function EditOriginalButton( { clientId }: EditOriginalButtonProps ) {
	const { postType, postId, canUserEdit, onNavigateToEntityRecord } =
		useSelect(
			( select ) => {
				const block = select( blockEditorStore ).getBlock( clientId );
				// Editor settings are typed as a bare `Object`.
				const editorSettings = select(
					editorStore
				).getEditorSettings() as EditorSettings;
				const { ref, theme, slug } = block?.attributes ?? {};
				const isTemplatePartBlock = !! block && isTemplatePart( block );
				const _postType = isTemplatePartBlock
					? 'wp_template_part'
					: 'wp_block';
				const _postId = isTemplatePartBlock
					? theme && slug && `${ theme }//${ slug }`
					: ref;

				return {
					postType: _postType,
					postId: _postId,
					// Matches the block toolbar's "Edit original" button.
					canUserEdit:
						! _postId ||
						!! select( coreStore ).canUser( 'update', {
							kind: 'postType',
							name: _postType,
							id: _postId,
						} ),
					onNavigateToEntityRecord:
						editorSettings.onNavigateToEntityRecord,
				};
			},
			[ clientId ]
		);

	if ( ! canUserEdit || ! onNavigateToEntityRecord ) {
		return null;
	}

	return (
		<Stack
			direction="column"
			className="block-editor-block-inspector-edit-contents"
		>
			<Button
				className="block-editor-block-inspector-edit-contents__button"
				__next40pxDefaultSize
				variant="secondary"
				onClick={ () =>
					onNavigateToEntityRecord( { postId, postType } )
				}
				accessibleWhenDisabled
				disabled={ ! postId }
			>
				{ __( 'Edit original' ) }
			</Button>
		</Stack>
	);
}
