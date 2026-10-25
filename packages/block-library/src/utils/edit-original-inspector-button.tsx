import { Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { unlock } from '../lock-unlock';

const { PrivateBlockInspectorEditOriginal } = unlock( blockEditorPrivateApis );

interface EditOriginalInspectorButtonProps {
	/** Client ID of the block that renders the entity. */
	clientId: string;
	/** The entity's post type, such as `wp_block` or `wp_template_part`. */
	postType: string;
	/** The entity's ID. The button is disabled while it's unknown. */
	postId?: number | string;
}

/**
 * The block inspector's "Edit original" button for a block that renders an
 * entity, such as a synced pattern or a template part. It opens the entity
 * for editing, and only shows for users who can edit it, on a block that
 * isn't locked against editing.
 *
 * @param props          Component props.
 * @param props.clientId Client ID of the block that renders the entity.
 * @param props.postType The entity's post type.
 * @param props.postId   The entity's ID.
 */
export default function EditOriginalInspectorButton( {
	clientId,
	postType,
	postId,
}: EditOriginalInspectorButtonProps ) {
	const { canUserEdit, onNavigateToEntityRecord } = useSelect(
		( select ) => {
			const { canEditBlock, getSettings } = select( blockEditorStore );
			return {
				// Matches the block toolbar's "Edit original" button.
				canUserEdit:
					canEditBlock( clientId ) &&
					( ! postId ||
						!! select( coreStore ).canUser( 'update', {
							kind: 'postType',
							name: postType,
							id: postId,
						} ) ),
				onNavigateToEntityRecord:
					getSettings().onNavigateToEntityRecord,
			};
		},
		[ clientId, postType, postId ]
	);

	if ( ! canUserEdit || ! onNavigateToEntityRecord ) {
		return null;
	}

	return (
		<PrivateBlockInspectorEditOriginal.Fill>
			{ ( { clientId: inspectedClientId }: { clientId: string } ) =>
				inspectedClientId === clientId && (
					<Stack
						direction="column"
						className="block-editor-block-inspector-edit-contents"
					>
						<Button
							className="block-editor-block-inspector-edit-contents__button"
							__next40pxDefaultSize
							variant="secondary"
							onClick={ () =>
								onNavigateToEntityRecord( {
									// The button is disabled without an ID.
									postId: postId as number | string,
									postType,
								} )
							}
							accessibleWhenDisabled
							disabled={ ! postId }
						>
							{ __( 'Edit original' ) }
						</Button>
					</Stack>
				)
			}
		</PrivateBlockInspectorEditOriginal.Fill>
	);
}
