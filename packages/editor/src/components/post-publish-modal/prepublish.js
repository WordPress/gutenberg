/**
 * External dependencies
 */
import { get, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
// import { PanelBody } from '@wordpress/components';

import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostVisibilityLabel from '../post-visibility/label';
import PostScheduleLabel from '../post-schedule/label';
import { visibilityOptions } from '../post-visibility/utils';
// import PostVisibility from '../post-visibility';
// import PostSchedule from '../post-schedule';
// import MaybeTagsPanel from './maybe-tags-panel';
// import MaybePostFormatPanel from './maybe-post-format-panel';

function PostPublishModalPrepublish( {
	hasPublishAction,
	publishDate,
	isFloating,
	visibility,
	children,
} ) {
	let prePublishBodyText,
		prePublishDateText;

	if ( ! hasPublishAction ) {
		prePublishBodyText = __( 'When you’re ready, submit your work for review, and an Editor will be able to approve it for you.' );
	} else {
		prePublishBodyText = __( 'Double-check your settings before publishing.' );
	}

	if ( isFloating ) {
		prePublishDateText = __( 'Your work will be published right now.' );
	} else if ( new Date( publishDate ) < new Date() ) {
		prePublishDateText = __( 'Your work will be published right now and back-dated.' );
	} else {
		prePublishDateText = __( 'Your work will be published at the specified date and time.' );
	}

	const getVisibilityInfo = () => find( visibilityOptions, { value: visibility } ).info;

	return (
		<div className="editor-post-publish-modal__prepublish">
			<p>{ prePublishBodyText }</p>
			{ hasPublishAction && (
				<>
					<div className="editor-post-publish-modal-panel">
						<div className="editor-post-publish-modal-panel__heading">
							{ __( 'Visibility:' ) }
						</div>
						<div className="editor-post-publish-modal-panel__value">
							<PostVisibilityLabel />
						</div>
						<div className="editor-post-publish-modal__detail">
							{ getVisibilityInfo( visibility ) }
						</div>
					</div>
					<div className="editor-post-publish-modal-panel">
						<div className="editor-post-publish-modal-panel__heading">
							{ __( 'Publish:' ) }
						</div>
						<div className="editor-post-publish-modal-panel__value">
							<PostScheduleLabel />
						</div>
						<div className="editor-post-publish-modal__detail">
							{ prePublishDateText }
						</div>
					</div>
					<div className="editor-post-publish-modal-panel">
						{ children }
					</div>
				</>
			) }
		</div>
	);
}

export default withSelect(
	( select ) => {
		const {
			getCurrentPost,
			getEditedPostVisibility,
			getEditedPostAttribute,
			isEditedPostDateFloating,
		} = select( 'core/editor' );
		return {
			hasPublishAction: get( getCurrentPost(), [ '_links', 'wp:action-publish' ], false ),
			visibility: getEditedPostVisibility(),
			publishDate: getEditedPostAttribute( 'date' ),
			isFloating: isEditedPostDateFloating(),
		};
	}
)( PostPublishModalPrepublish );
