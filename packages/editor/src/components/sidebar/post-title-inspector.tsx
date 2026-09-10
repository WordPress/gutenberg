import { __, sprintf } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import { Notice } from '@wordpress/components';
import { Stack, Text } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
// @ts-expect-error No exported types
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import { store as editorStore } from '../../store';
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import { unlock } from '../../lock-unlock';

const { BlockCard } = unlock( blockEditorPrivateApis );
const { getTemplateInfo } = unlock( coreDataPrivateApis );

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
	const {
		templateId,
		templateTitle,
		onNavigateToEntityRecord,
		canEditTemplate,
	} = useSelect( ( select ) => {
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
		const { canUser, getEntityRecord, getCurrentTheme } =
			select( coreStore );
		const currentTemplateId = getCurrentTemplateId();

		/*
		 * A template's own title is empty, or just its slug, until someone
		 * renames it. `getTemplateInfo` falls back to the name the theme
		 * gives it — "Pages", "Single Posts" — which is what the rest of
		 * the editor shows.
		 */
		const templateInfo = currentTemplateId
			? getTemplateInfo( {
					templateTypes:
						(
							getCurrentTheme() as
								| { default_template_types?: unknown[] }
								| undefined
						 )?.default_template_types ?? [],
					template: getEntityRecord(
						'postType',
						TEMPLATE_POST_TYPE,
						currentTemplateId
					),
			  } )
			: undefined;

		return {
			templateId: currentTemplateId,
			templateTitle: templateInfo?.title as string | undefined,
			onNavigateToEntityRecord:
				getEditorSettings().onNavigateToEntityRecord,
			canEditTemplate: !! canUser( 'create', {
				kind: 'postType',
				name: TEMPLATE_POST_TYPE,
			} ),
		};
	}, [] );

	const blockType = getBlockType( POST_TITLE_BLOCK );

	if ( ! blockType ) {
		return null;
	}

	const title = templateTitle ? decodeEntities( templateTitle ) : undefined;

	/*
	 * A template that cannot be named is no reason to withhold the
	 * explanation; the button just says "Edit template" instead.
	 */
	const canExplain = !! templateId && canEditTemplate;

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
										label: title
											? sprintf(
													// translators: %s: name of the template, e.g. "Pages".
													__( 'Edit %s template' ),
													title
											  )
											: __( 'Edit template' ),
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
					<Stack direction="column" gap="sm">
						<Text render={ <p /> }>
							<strong>
								{ __( 'This block comes from the template' ) }
							</strong>
						</Text>
						<Text render={ <p /> }>
							{ __(
								'Changes to its settings affect all posts and pages that use the template.'
							) }
						</Text>
					</Stack>
				</Notice>
			) }
		</Stack>
	);
}
