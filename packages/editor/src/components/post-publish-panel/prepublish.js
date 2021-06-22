/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { wordpress } from '@wordpress/icons';
import { filterURLForDisplay } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostVisibility from '../post-visibility';
import PostVisibilityLabel from '../post-visibility/label';
import PostSchedule from '../post-schedule';
import PostScheduleLabel from '../post-schedule/label';
import MaybeTagsPanel from './maybe-tags-panel';
import MaybePostFormatPanel from './maybe-post-format-panel';
import { store as editorStore } from '../../store';

function PostPublishPanelPrepublish( { children } ) {
	const {
		isBeingScheduled,
		isRequestingSiteIcon,
		hasPublishAction,
		siteIconUrl,
		siteTitle,
		siteHome,
	} = useSelect( ( select ) => {
		const { getCurrentPost, isEditedPostBeingScheduled } = select(
			editorStore
		);
		const { getEntityRecord, isResolving } = select( coreStore );
		const siteData =
			getEntityRecord( 'root', '__unstableBase', undefined ) || {};

		return {
			hasPublishAction: get(
				getCurrentPost(),
				[ '_links', 'wp:action-publish' ],
				false
			),
			isBeingScheduled: isEditedPostBeingScheduled(),
			isRequestingSiteIcon: isResolving( 'getEntityRecord', [
				'root',
				'__unstableBase',
				undefined,
			] ),
			siteIconUrl: siteData.site_icon_url,
			siteTitle: siteData.name,
			siteHome: siteData.home && filterURLForDisplay( siteData.home ),
		};
	}, [] );

	let siteIcon = (
		<Icon className="components-site-icon" size="36px" icon={ wordpress } />
	);

	if ( siteIconUrl ) {
		siteIcon = (
			<img
				alt={ __( 'Site Icon' ) }
				className="components-site-icon"
				src={ siteIconUrl }
			/>
		);
	}

	if ( isRequestingSiteIcon ) {
		siteIcon = null;
	}

	let prePublishTitle, prePublishBodyText;

	if ( ! hasPublishAction ) {
		prePublishTitle = __( 'Are you ready to submit for review?' );
		prePublishBodyText = __(
			'When you’re ready, submit your work for review, and an Editor will be able to approve it for you.'
		);
	} else if ( isBeingScheduled ) {
		prePublishTitle = __( 'Are you ready to schedule?' );
		prePublishBodyText = __(
			'Your work will be published at the specified date and time.'
		);
	} else {
		prePublishTitle = __( 'Are you ready to publish?' );
		prePublishBodyText = __(
			'Double-check your settings before publishing.'
		);
	}

	return (
		<div className="editor-post-publish-panel__prepublish">
			<div>
				<strong>{ prePublishTitle }</strong>
			</div>
			<p>{ prePublishBodyText }</p>
			<div className="components-site-card">
				{ siteIcon }
				<div className="components-site-info">
					<span className="components-site-name">
						{ siteTitle || __( '(Untitled)' ) }
					</span>
					<span className="components-site-home">{ siteHome }</span>
				</div>
			</div>
			{ hasPublishAction && (
				<>
					<PanelBody
						initialOpen={ false }
						title={ [
							__( 'Visibility:' ),
							<span
								className="editor-post-publish-panel__link"
								key="label"
							>
								<PostVisibilityLabel />
							</span>,
						] }
					>
						<PostVisibility />
					</PanelBody>
					<PanelBody
						initialOpen={ false }
						title={ [
							__( 'Publish:' ),
							<span
								className="editor-post-publish-panel__link"
								key="label"
							>
								<PostScheduleLabel />
							</span>,
						] }
					>
						<PostSchedule />
					</PanelBody>
				</>
			) }
			<MaybePostFormatPanel />
			<MaybeTagsPanel />
			{ children }
		</div>
	);
}

export default PostPublishPanelPrepublish;
