/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import PostVisibility from '../post-visibility';
import PostVisibilityLabel from '../post-visibility/label';
import PostSchedule from '../post-schedule';
import PostScheduleLabel from '../post-schedule/label';

function PostPublishPanelPrepublish( {
	user,
} ) {
	const userCanPublishPosts = get( user.data, [ 'post_type_capabilities', 'publish_posts' ], false );
	const isContributor = user.data && ! userCanPublishPosts;
	if ( isContributor ) {
		return (
			<div className="editor-post-publish-panel__prepublish">
				<div><strong>{ __( 'Are you ready to submit for review?' ) }</strong></div>
				<p>{ __( 'Here, you can do a last-minute check up of your settings below, before you submit for review.' ) }</p>
			</div>
		);
	}

	return (
		<div className="editor-post-publish-panel__prepublish">
			<div><strong>{ __( 'Are you ready to publish?' ) }</strong></div>
			<p>{ __( 'Here, you can do a last-minute check up of your settings below, before you publish.' ) }</p>
			<PanelBody initialOpen={ false } title={ [
				__( 'Visibility: ' ),
				<span className="editor-post-publish-panel__link" key="label"><PostVisibilityLabel /></span>,
			] }>
				<PostVisibility />
			</PanelBody>
			<PanelBody initialOpen={ false } title={ [
				__( 'Publish: ' ),
				<span className="editor-post-publish-panel__link" key="label"><PostScheduleLabel /></span>,
			] }>
				<PostSchedule />
			</PanelBody>
		</div>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getCurrentPostType,
		} = select( 'core/editor' );
		return {
			postType: getCurrentPostType(),
		};
	} ),
	withAPIData( ( props ) => {
		const { postType } = props;

		return {
			user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
		};
	} ),
] )( PostPublishPanelPrepublish );
