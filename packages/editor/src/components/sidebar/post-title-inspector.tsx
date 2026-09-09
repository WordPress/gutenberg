import { __, sprintf } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import { Notice } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
// @ts-expect-error No exported types
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { store as editorStore } from '../../store';
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import { unlock } from '../../lock-unlock';

const { BlockCard } = unlock( blockEditorPrivateApis );

const POST_TITLE_BLOCK = 'core/post-title';

/**
 * Describes the post title while it has focus.
 *
 * With the template hidden the title is editor chrome rather than a block, so
 * there is nothing for the block inspector to select and it reports that
 * nothing is. The text itself belongs to the post and is edited in place; only
 * its appearance comes from the template, which is what this explains.
 *
 * @return The rendered panel.
 */
export default function PostTitleInspector() {
	const { templateId, onNavigateToEntityRecord, canEditTemplate } = useSelect(
		( select ) => {
			const { getCurrentTemplateId, getEditorSettings } = select(
				editorStore
			) as {
				getCurrentTemplateId: () => string | undefined;
				getEditorSettings: () => {
					onNavigateToEntityRecord?: ( args: {
						postId: string;
						postType: string;
					} ) => void;
				};
			};
			const { canUser } = select( coreStore );

			return {
				templateId: getCurrentTemplateId(),
				onNavigateToEntityRecord:
					getEditorSettings().onNavigateToEntityRecord,
				canEditTemplate: !! canUser( 'create', {
					kind: 'postType',
					name: TEMPLATE_POST_TYPE,
				} ),
			};
		},
		[]
	);

	// Nothing to fetch until the post resolves which template it uses.
	const { editedRecord: template } = useEntityRecord< { title?: string } >(
		'postType',
		TEMPLATE_POST_TYPE,
		templateId ?? '',
		{ enabled: !! templateId }
	);

	const blockType = getBlockType( POST_TITLE_BLOCK );

	if ( ! blockType ) {
		return null;
	}

	const templateTitle = template?.title
		? decodeEntities( template.title )
		: undefined;

	/*
	 * Without a template to name there is nothing useful to say about where the
	 * title's appearance comes from, so only the card is shown.
	 */
	const canExplain = !! templateTitle && canEditTemplate;

	return (
		<Stack direction="column" gap="md">
			<BlockCard
				title={ blockType.title }
				icon={ blockType.icon }
				description={ blockType.description }
			/>
			{ canExplain && (
				<Notice
					status="info"
					isDismissible={ false }
					className="editor-post-title-inspector__notice"
					actions={
						onNavigateToEntityRecord
							? [
									{
										label: sprintf(
											// translators: %s: name of the template, e.g. "Pages".
											__( 'Edit %s template' ),
											templateTitle
										),
										onClick: () =>
											onNavigateToEntityRecord( {
												postId: templateId as string,
												postType: TEMPLATE_POST_TYPE,
											} ),
										variant: 'secondary',
									},
							  ]
							: []
					}
				>
					<p>
						<strong>
							{ __( 'This block comes from the template' ) }
						</strong>
					</p>
					<p>
						{ __(
							'Changes to its settings affect all posts and pages that use the template.'
						) }
					</p>
				</Notice>
			) }
		</Stack>
	);
}
