import { getBlockType } from '@wordpress/blocks';
import { Stack } from '@wordpress/ui';
// @ts-expect-error No exported types
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { unlock } from '../../lock-unlock';
import TemplateScopeNotice from './template-scope-notice';

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
	const blockType = getBlockType( POST_TITLE_BLOCK );

	if ( ! blockType ) {
		return null;
	}

	return (
		<Stack direction="column" gap="md">
			<BlockCard
				title={ blockType.title }
				icon={ blockType.icon }
				description={ blockType.description }
			/>
			<TemplateScopeNotice />
		</Stack>
	);
}
