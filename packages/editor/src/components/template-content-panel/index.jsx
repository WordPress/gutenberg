import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as interfaceStore } from '@wordpress/interface';
import { unlock } from '../../lock-unlock';
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import { store as editorStore } from '../../store';
import usePostContentBlockTypes from '../provider/use-post-content-block-types';

const { BlockQuickNavigation } = unlock( blockEditorPrivateApis );

const TEMPLATE_PART_BLOCK = 'core/template-part';
const TEMPLATE_SLOT_BLOCK = 'core/template-slot';

function TemplateContentPanelInner( { postType } ) {
	const postContentBlockTypes = usePostContentBlockTypes();

	const { contentBlocks, templatePartsAround } = useSelect(
		( select ) => {
			const { getPostBlocksByName, getTemplatePartsOutsidePostBlocks } =
				unlock( select( editorStore ) );
			if ( TEMPLATE_POST_TYPE !== postType ) {
				return {
					contentBlocks: getPostBlocksByName( postContentBlockTypes ),
				};
			}

			return {
				contentBlocks: getPostBlocksByName( TEMPLATE_PART_BLOCK ),
				// A template shown inside the template it names is rendered
				// by the slot of that template, whose own template parts are
				// on the canvas too. They belong to that template, which is
				// edited on its own screen.
				templatePartsAround: getPostBlocksByName(
					TEMPLATE_SLOT_BLOCK,
					true
				).length
					? getTemplatePartsOutsidePostBlocks(
							TEMPLATE_SLOT_BLOCK,
							true
						)
					: undefined,
			};
		},
		[ postType, postContentBlockTypes ]
	);
	const clientIds = useMemo(
		() =>
			templatePartsAround
				? contentBlocks.filter(
						( clientId ) =>
							! templatePartsAround.includes( clientId )
					)
				: contentBlocks,
		[ contentBlocks, templatePartsAround ]
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
