/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	PluginDocumentSettingPanel,
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useCallback } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';

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
	const { createSuccessNotice } = useDispatch( noticesStore );
	const history = useHistory();
	const onActionPerformed = useCallback(
		( actionId, items ) => {
			switch ( actionId ) {
				case 'move-to-trash':
					{
						history.push( {
							path: '/' + items[ 0 ].type,
							postId: undefined,
							postType: undefined,
							canvas: 'view',
						} );
					}
					break;
				case 'duplicate-post':
					{
						const newItem = items[ 0 ];
						const title =
							typeof newItem.title === 'string'
								? newItem.title
								: newItem.title?.rendered;
						createSuccessNotice(
							sprintf(
								// translators: %s: Title of the created post e.g: "Post 1".
								__( '"%s" successfully created.' ),
								title
							),
							{
								type: 'snackbar',
								id: 'duplicate-post-action',
								actions: [
									{
										label: __( 'Edit' ),
										onClick: () => {
											history.push( {
												path: undefined,
												postId: newItem.id,
												postType: newItem.type,
												canvas: 'edit',
											} );
										},
									},
								],
							}
						);
					}
					break;
			}
		},
		[ history, createSuccessNotice ]
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
		</>
	);
}
