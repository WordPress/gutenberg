/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	PageAttributesPanel,
	PluginDocumentSettingPanel,
	PostDiscussionPanel,
	PostExcerptPanel,
	PostLastRevisionPanel,
	PostTaxonomiesPanel,
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import PageContent from './page-content';
import PageSummary from './page-summary';
import { unlock } from '../../../lock-unlock';

const { PostCardPanel } = unlock( editorPrivateApis );

export default function PagePanels() {
	const { id, type, hasResolved, status, date, password, renderingMode } =
		useSelect( ( select ) => {
			const { getEditedPostContext } = select( editSiteStore );
			const { getEditedEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const { getRenderingMode } = select( editorStore );
			const context = getEditedPostContext();
			const queryArgs = [ 'postType', context.postType, context.postId ];
			const page = getEditedEntityRecord( ...queryArgs );
			return {
				hasResolved: hasFinishedResolution(
					'getEditedEntityRecord',
					queryArgs
				),
				id: page?.id,
				type: page?.type,
				status: page?.status,
				date: page?.date,
				password: page?.password,
				renderingMode: getRenderingMode(),
			};
		}, [] );

	if ( ! hasResolved ) {
		return null;
	}

	return (
		<>
			<PostCardPanel />
			<PanelBody title={ __( 'Summary' ) }>
				<PageSummary
					status={ status }
					date={ date }
					password={ password }
					postId={ id }
					postType={ type }
				/>
			</PanelBody>
			<PluginDocumentSettingPanel.Slot />
			{ renderingMode !== 'post-only' && (
				<PanelBody title={ __( 'Content' ) }>
					<PageContent />
				</PanelBody>
			) }
			<PostLastRevisionPanel />
			<PostTaxonomiesPanel />
			<PostExcerptPanel />
			<PostDiscussionPanel />
			<PageAttributesPanel />
		</>
	);
}
