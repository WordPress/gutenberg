/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as interfaceStore } from '@wordpress/interface';
import { applyFilters } from '@wordpress/hooks';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import { store as editorStore } from '../../store';

const { BlockQuickNavigation } = unlock( blockEditorPrivateApis );

const POST_CONTENT_BLOCK_TYPES = [
	'core/post-title',
	'core/post-featured-image',
	'core/post-content',
];

const TEMPLATE_PART_BLOCK = 'core/template-part';

export default function TemplateContentPanel() {
	const postContentBlockTypes = useMemo(
		() =>
			applyFilters(
				'editor.postContentBlockTypes',
				POST_CONTENT_BLOCK_TYPES
			),
		[]
	);

	const { clientIds, postType, renderingMode } = useSelect(
		( select ) => {
			const {
				getCurrentPostType,
				getPostBlocksByName,
				getRenderingMode,
			} = unlock( select( editorStore ) );
			const _postType = getCurrentPostType();
			return {
				postType: _postType,
				clientIds: getPostBlocksByName(
					TEMPLATE_POST_TYPE === _postType
						? TEMPLATE_PART_BLOCK
						: postContentBlockTypes
				),
				renderingMode: getRenderingMode(),
			};
		},
		[ postContentBlockTypes ]
	);

	const { enableComplementaryArea } = useDispatch( interfaceStore );

	if ( renderingMode === 'post-only' && postType !== TEMPLATE_POST_TYPE ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Content' ) }>
			<BlockQuickNavigation
				clientIds={ clientIds }
				onSelect={ () => {
					enableComplementaryArea( 'core', 'edit-post/document' );
				} }
			/>
		</PanelBody>
	);
}
