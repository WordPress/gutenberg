/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import { store as editorStore } from '../../store';

const { BlockQuickNavigation } = unlock( blockEditorPrivateApis );

const PAGE_CONTENT_BLOCKS = [
	'core/post-content',
	'core/post-featured-image',
	'core/post-title',
];

const TEMPLATE_PART_BLOCK = 'core/template-part';

export default function TemplateContentPanel( renderingMode ) {
	const { clientIds, postType } = useSelect( ( select ) => {
		const { getBlocksByName } = select( blockEditorStore );
		const { getCurrentPostType } = select( editorStore );
		const _postType = getCurrentPostType();
		return {
			postType: _postType,
			clientIds: getBlocksByName(
				TEMPLATE_POST_TYPE === _postType
					? TEMPLATE_PART_BLOCK
					: PAGE_CONTENT_BLOCKS
			),
		};
	}, [] );
	if ( renderingMode !== 'post-only' && postType !== TEMPLATE_POST_TYPE ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Content' ) }>
			<BlockQuickNavigation clientIds={ clientIds } />
		</PanelBody>
	);
}
