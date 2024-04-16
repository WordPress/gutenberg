/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { PanelBody, PanelRow } from '@wordpress/components';
import {
	PageAttributesPanel,
	PostDiscussionPanel,
	PostExcerptPanel,
	PostLastRevisionPanel,
	PostTaxonomiesPanel,
	privateApis as editorPrivateApis,
	store as editorStore,
} from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { useAsyncList } from '@wordpress/compose';
import { serialize } from '@wordpress/blocks';
import { __experimentalBlockPatternsList as BlockPatternsList } from '@wordpress/block-editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import TemplateActions from '../../template-actions';
import PluginTemplateSettingPanel from '../../plugin-template-setting-panel';
import { useAvailablePatterns } from './hooks';
import { TEMPLATE_PART_POST_TYPE } from '../../../utils/constants';
import { unlock } from '../../../lock-unlock';

const { PostCardPanel } = unlock( editorPrivateApis );
const { PatternOverridesPanel } = unlock( editorPrivateApis );
const { useHistory } = unlock( routerPrivateApis );

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

const POST_TYPE_PATH = {
	wp_template: '/wp_template',
	wp_template_part: '/patterns',
};

export default function TemplatePanel() {
	const { title, description, record, postType, postId } = useSelect(
		( select ) => {
			const { getEditedPostType, getEditedPostId } =
				select( editSiteStore );
			const { getEditedEntityRecord } = select( coreStore );
			const { __experimentalGetTemplateInfo: getTemplateInfo } =
				select( editorStore );

			const type = getEditedPostType();
			const _postId = getEditedPostId();
			const _record = getEditedEntityRecord( 'postType', type, _postId );
			const info = getTemplateInfo( _record );

			return {
				title: info.title,
				description: info.description,
				icon: info.icon,
				record: _record,
				postType: type,
				postId: _postId,
			};
		},
		[]
	);
	const history = useHistory();
	const availablePatterns = useAvailablePatterns( record );
	const { editEntityRecord } = useDispatch( coreStore );

	if ( ! title && ! description ) {
		return null;
	}

	const onTemplateSelect = async ( selectedTemplate ) => {
		await editEntityRecord( 'postType', postType, postId, {
			blocks: selectedTemplate.blocks,
			content: serialize( selectedTemplate.blocks ),
		} );
	};

	return (
		<>
			<PostCardPanel
				className="edit-site-template-card"
				actions={
					<TemplateActions
						postType={ postType }
						postId={ postId }
						className="edit-site-template-card__actions"
						toggleProps={ { size: 'small' } }
						onRemove={ () => {
							history.push( {
								path: POST_TYPE_PATH[ postType ],
							} );
						} }
					/>
				}
			/>
			<PluginTemplateSettingPanel.Slot />
			{ availablePatterns?.length > 0 && (
				<PanelBody
					title={ __( 'Transform into:' ) }
					initialOpen={ postType === TEMPLATE_PART_POST_TYPE }
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
			) }
			<PostLastRevisionPanel />
			<PostTaxonomiesPanel />
			<PostExcerptPanel />
			<PostDiscussionPanel />
			<PageAttributesPanel />
			<PatternOverridesPanel />
		</>
	);
}
