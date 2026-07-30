/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import { store as editorStore } from '../../store';
import usePostContentBlockTypes from '../provider/use-post-content-block-types';

const { BlockQuickNavigation } = unlock( blockEditorPrivateApis );

const TEMPLATE_PART_BLOCK = 'core/template-part';

function TemplateContentPanelInner( { postType } ) {
	const postContentBlockTypes = usePostContentBlockTypes();

	const clientIds = useSelect(
		( select ) => {
			const { getPostBlocksByName } = unlock( select( editorStore ) );
			return getPostBlocksByName(
				TEMPLATE_POST_TYPE === postType
					? TEMPLATE_PART_BLOCK
					: postContentBlockTypes
			);
		},
		[ postType, postContentBlockTypes ]
	);

	const { enableComplementaryArea } = useDispatch( interfaceStore );

	if ( clientIds.length === 0 ) {
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

export default function TemplateContentPanel() {
	const { postType, renderingMode } = useSelect( ( select ) => {
		const { getCurrentPostType, getRenderingMode } = unlock(
			select( editorStore )
		);
		return {
			postType: getCurrentPostType(),
			renderingMode: getRenderingMode(),
		};
	}, [] );

	if ( renderingMode === 'post-only' && postType !== TEMPLATE_POST_TYPE ) {
		return null;
	}

	return <TemplateContentPanelInner postType={ postType } />;
}
