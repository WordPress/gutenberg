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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import PageContent from './page-content';
import PageSummary from './page-summary';

import { unlock } from '../../../lock-unlock';

const { PostCardPanel, PostActions } = unlock( editorPrivateApis );
const { useHistory } = unlock( routerPrivateApis );

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

	const history = useHistory();
	const onActionPerformed = useCallback(
		( actionId, items ) => {
			if ( actionId === 'move-to-trash' ) {
				history.push( {
					path: '/' + items[ 0 ].type,
					postId: undefined,
					postType: undefined,
					canvas: 'view',
				} );
			}
		},
		[ history ]
	);

	if ( ! hasResolved ) {
		return null;
	}

	return (
		<>
			<PostCardPanel
				actions={
					<PostActions onActionPerformed={ onActionPerformed } />
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
