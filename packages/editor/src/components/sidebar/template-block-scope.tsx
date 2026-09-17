import { useSelect } from '@wordpress/data';
// @ts-expect-error No exported types
// prettier-ignore
import { privateApis as blockEditorPrivateApis, store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '../../store';
import usePostContentBlockTypes from '../provider/use-post-content-block-types';
import TemplateScopeNotice from './template-scope-notice';
import { unlock } from '../../lock-unlock';

const { BlockInspectorPreTabsFill } = unlock( blockEditorPrivateApis );

/**
 * Explains, in the block inspector, that the selected block belongs to the
 * template rather than to the post.
 *
 * With the template shown, most of it is inert and cannot be selected at all.
 * The exceptions are the blocks that render post data — Title, Featured Image
 * and Content — which stay selectable so their content can be edited from
 * here. Their settings still belong to the template, and nothing said so.
 *
 * @return The rendered notice.
 */
export default function TemplateBlockScope() {
	const postContentBlockTypes = usePostContentBlockTypes();

	const isTemplateBlockSelected = useSelect(
		( select ) => {
			const { getRenderingMode } = select( editorStore ) as {
				getRenderingMode: () => string;
			};

			if ( getRenderingMode() !== 'template-locked' ) {
				return false;
			}

			const { getSelectedBlockClientId, getBlockName } =
				select( blockEditorStore );
			const clientId = getSelectedBlockClientId();

			return (
				!! clientId &&
				postContentBlockTypes.includes( getBlockName( clientId ) )
			);
		},
		[ postContentBlockTypes ]
	);

	if ( ! isTemplateBlockSelected ) {
		return null;
	}

	return (
		<BlockInspectorPreTabsFill>
			<TemplateScopeNotice />
		</BlockInspectorPreTabsFill>
	);
}
