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
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import PageActions from '../../page-actions';
import PageContent from './page-content';
import PageSummary from './page-summary';

import { unlock } from '../../../lock-unlock';

const { PostCardPanel } = unlock( editorPrivateApis );
const { useHistory } = unlock( routerPrivateApis );

export default function PagePanels() {
	const { hasResolved, page, renderingMode } = useSelect( ( select ) => {
		const { getEditedPostContext } = select( editSiteStore );
		const { getEditedEntityRecord, hasFinishedResolution } =
			select( coreStore );
		const { getRenderingMode } = select( editorStore );
		const context = getEditedPostContext();
		const queryArgs = [ 'postType', context.postType, context.postId ];
		return {
			hasResolved: hasFinishedResolution(
				'getEditedEntityRecord',
				queryArgs
			),
			page: getEditedEntityRecord( ...queryArgs ),
			renderingMode: getRenderingMode(),
		};
	}, [] );
	const history = useHistory();

	const { id, type, status, date, password } = page;

	if ( ! hasResolved ) {
		return null;
	}

	return (
		<>
			<PostCardPanel
				actions={
					<PageActions
						page={ page }
						className="edit-site-page-card__actions"
						toggleProps={ { size: 'small' } }
						onRemove={ () => {
							history.push( {
								path: '/page',
							} );
						} }
					/>
				}
			/>
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
