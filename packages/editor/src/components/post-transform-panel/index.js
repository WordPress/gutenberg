/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { PanelBody, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useAsyncList } from '@wordpress/compose';
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
	const shownTemplates = useAsyncList( availableTemplates );
	if ( ! availableTemplates || availableTemplates?.length === 0 ) {
		return null;
	}

	return (
		<BlockPatternsList
			label={ __( 'Templates' ) }
			blockPatterns={ availableTemplates }
			shownPatterns={ shownTemplates }
			onClickPattern={ onSelect }
			showTitlesAsTooltip
		/>
	);
}

function PostTransform() {
	const { record, postType, postId } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		const { getEditedEntityRecord } = select( coreStore );
		const type = getCurrentPostType();
		const id = getCurrentPostId();
		return {
			postType: type,
			postId: id,
			record: getEditedEntityRecord( 'postType', type, id ),
		};
	}, [] );
	const { editEntityRecord } = useDispatch( coreStore );
	const availablePatterns = useAvailablePatterns( record );
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
			title={ __( 'Transform into:' ) }
			initialOpen={ record.type === TEMPLATE_PART_POST_TYPE }
		>
			<PanelRow>
				<p>
					{ __(
						'Choose a predefined pattern to switch up the look of your template.' // TODO - make this dynamic?
					) }
				</p>
			</PanelRow>

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
