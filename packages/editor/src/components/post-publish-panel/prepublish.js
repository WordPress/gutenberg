/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostVisibility from '../post-visibility';
import PostVisibilityLabel from '../post-visibility/label';
import PostSchedule from '../post-schedule';
import PostScheduleLabel from '../post-schedule/label';
import MaybeTagsPanel from './maybe-tags-panel';
import MaybePostFormatPanel from './maybe-post-format-panel';

function PostPublishPanelPrepublish( {
	hasPublishAction,
	isBeingScheduled,
	children,
} ) {
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

export default withSelect( ( select ) => {
	const { getCurrentPost, isEditedPostBeingScheduled } = select(
		'core/editor'
	);
	return {
		hasPublishAction: get(
			getCurrentPost(),
			[ '_links', 'wp:action-publish' ],
			false
		),
		isBeingScheduled: isEditedPostBeingScheduled(),
	};
} )( PostPublishPanelPrepublish );
