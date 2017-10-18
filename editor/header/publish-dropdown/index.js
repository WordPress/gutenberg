/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { withAPIData, PanelBody } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostVisibilityLabel from '../../post-visibility/label';
import PostVisibilityForm from '../../post-visibility';
import PostScheduleLabel from '../../post-schedule/label';
import PostScheduleForm from '../../post-schedule';
import PublishButton from '../publish-button';

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
					<PostVisibilityForm />
				</PanelBody>
			}
			{ canPublish &&
				<PanelBody initialOpen={ false } title={ [
					__( 'Publish: ' ),
					<PostScheduleLabel key="label" />,
				] }>
					<PostScheduleForm />
				</PanelBody>
			}
			<div className="editor-publish-dropdown__publish-button-container">
				<PublishButton onSubmit={ onSubmit } />
			</div>
		</div>
	);
}

export default withAPIData( () => {
	return {
		user: '/wp/v2/users/me?context=edit',
	};
} )( PublishDropdown );
