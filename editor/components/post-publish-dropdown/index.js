/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withAPIData, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import PostVisibility from '../post-visibility';
import PostVisibilityLabel from '../post-visibility/label';
import PostSchedule from '../post-schedule';
import PostScheduleLabel from '../post-schedule/label';
import PostPublishButton from '../post-publish-button';
import PostSwitchToDraftButton from '../post-switch-to-draft-button';

function PostPublishDropdown( { user, onSubmit } ) {
	const userCaps = user.data ?
		{ ...user.data.capabilities, ...user.data.post_type_capabilities } :
		{ 'publish_posts': false };
	const canPublish = userCaps.publish_posts;

	return (
		<div className="editor-post-publish-dropdown">
			<div><strong>{ __( 'All ready to go?' ) }</strong></div>
			{ ! canPublish &&
				<div>
					<span>{ __( 'Visibility' ) }</span>
					<span><PostVisibilityLabel /></span>
				</div>
			}
			{ canPublish &&
				<PanelBody initialOpen={ false } title={ [
					__( 'Visibility: ' ),
					<PostVisibilityLabel key="label" />,
				] }>
					<PostVisibility />
				</PanelBody>
			}
			{ canPublish &&
				<PanelBody initialOpen={ false } title={ [
					__( 'Publish: ' ),
					<PostScheduleLabel key="label" />,
				] }>
					<PostSchedule />
				</PanelBody>
			}
			<div className="editor-post-publish-dropdown__publish-button-container">
				<PostSwitchToDraftButton />
				<PostPublishButton onSubmit={ onSubmit } />
			</div>
		</div>
	);
}

export default withAPIData( () => {
	const postTypeSlug = window._wpGutenbergPost.type;

	return {
		user: `/wp/v2/users/me?post_type=${ postTypeSlug }&context=edit`,
	};
} )( PostPublishDropdown );
