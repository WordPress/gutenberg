/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { __experimentalBlockPatternsList as BlockPatternsList } from '@wordpress/block-editor';
import { serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { useAvailablePatterns } from './hooks';
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
} from '../../store/constants';

function TemplatesList( { availableTemplates, onSelect } ) {
	if ( ! availableTemplates || availableTemplates?.length === 0 ) {
		return null;
	}

	return (
		<BlockPatternsList
			label={ __( 'Templates' ) }
			blockPatterns={ availableTemplates }
			onClickPattern={ onSelect }
			showTitlesAsTooltip
		/>
	);
}

function PostTransform() {
	const { area, name, slug, postType, postId } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		const { getEditedEntityRecord } = select( coreStore );
		const type = getCurrentPostType();
		const id = getCurrentPostId();
		const record = getEditedEntityRecord( 'postType', type, id );

		return {
			area: record?.area,
			name: record?.name,
			slug: record?.slug,
			postType: type,
			postId: id,
		};
	}, [] );
	const { editEntityRecord } = useDispatch( coreStore );
	const availablePatterns = useAvailablePatterns( { area, name, slug } );
	const onTemplateSelect = async ( selectedTemplate ) => {
		await editEntityRecord( 'postType', postType, postId, {
			blocks: selectedTemplate.blocks,
			content: serialize( selectedTemplate.blocks ),
		} );
	};
	if ( ! availablePatterns?.length ) {
		return null;
	}

	return (
		<PanelBody
			title={ __( 'Design' ) }
			initialOpen={ postType === TEMPLATE_PART_POST_TYPE }
		>
			<TemplatesList
				availableTemplates={ availablePatterns }
				onSelect={ onTemplateSelect }
			/>
		</PanelBody>
	);
}

export default function PostTransformPanel() {
	const { postType } = useSelect( ( select ) => {
		const { getCurrentPostType } = select( editorStore );
		return {
			postType: getCurrentPostType(),
		};
	}, [] );

	if (
		! [ TEMPLATE_PART_POST_TYPE, TEMPLATE_POST_TYPE ].includes( postType )
	) {
		return null;
	}

	return <PostTransform />;
}
