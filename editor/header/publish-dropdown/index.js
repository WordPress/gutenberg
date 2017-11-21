/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { withAPIData, PanelBody, Slot } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import {
	PostVisibilityLabel,
	PostVisibility,
	PostScheduleLabel,
	PostSchedule,
	PostPublishButton,
} from '../../components';

function PublishDropdown( { user, onSubmit } ) {
	const canPublish = user.data && user.data.capabilities.publish_posts;

	return (
		<div className="editor-publish-dropdown">
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
			<Slot name="publish-dropdown" />
			<div className="editor-publish-dropdown__publish-button-container">
				<PostPublishButton onSubmit={ onSubmit } />
			</div>
		</div>
	);
}

export default withAPIData( () => {
	return {
		user: '/wp/v2/users/me?context=edit',
	};
} )( PublishDropdown );
