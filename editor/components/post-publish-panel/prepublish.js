/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import PostVisibility from '../post-visibility';
import PostVisibilityLabel from '../post-visibility/label';
import PostSchedule from '../post-schedule';
import PostScheduleLabel from '../post-schedule/label';

function PostPublishPanelPrepublish() {
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

export default PostPublishPanelPrepublish;
