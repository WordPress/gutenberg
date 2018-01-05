/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/element';
import { withAPIData, PanelBody, IconButton } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostVisibility from '../post-visibility';
import PostVisibilityLabel from '../post-visibility/label';
import PostSchedule from '../post-schedule';
import PostScheduleLabel from '../post-schedule/label';
import PostPublishButton from '../post-publish-button';
import PostSwitchToDraftButton from '../post-switch-to-draft-button';
import { getCurrentPostType } from '../../store/selectors';

function PostPublishPanel( { onClose, user } ) {
	const canPublish = user.data && user.data.capabilities.publish_posts;

	return (
		<div className="editor-post-publish-panel">
			<div className="editor-post-publish-panel__header">
				<div className="editor-post-publish-panel__header-publish-button">
					<PostPublishButton onSubmit={ onClose } />
				</div>
				<IconButton
					onClick={ onClose }
					icon="no-alt"
					label={ __( 'Close Publish Panel' ) }
				/>
			</div>

			<div className="editor-post-publish-panel__content">
				<div><strong>{ __( 'Are you ready to publish?' ) }</strong></div>
				<p>{ __( 'Here, you can do a last-minute check up of your settings below, before you publish.' ) }</p>
				{ ! canPublish &&
					<div>
						<span>{ __( 'Visibility' ) }</span>
						<span><PostVisibilityLabel /></span>
					</div>
				}
				{ canPublish &&
					<PanelBody initialOpen={ false } title={ [
						__( 'Visibility: ' ),
						<span className="editor-post-publish-panel__link" key="label"><PostVisibilityLabel /></span>,
					] }>
						<PostVisibility />
					</PanelBody>
				}
				{ canPublish &&
					<PanelBody initialOpen={ false } title={ [
						__( 'Publish: ' ),
						<span className="editor-post-publish-panel__link" key="label"><PostScheduleLabel /></span>,
					] }>
						<PostSchedule />
					</PanelBody>
				}
			</div>

			<div className="editor-post-publish-panel__footer">
				<PostSwitchToDraftButton />
			</div>
		</div>
	);
}

const applyConnect = connect(
	( state ) => {
		return {
			postType: getCurrentPostType( state ),
		};
	},
);

const applyWithAPIData = withAPIData( ( props ) => {
	const { postType } = props;

	return {
		user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
	};
} );

export default compose( [
	applyConnect,
	applyWithAPIData,
] )( PostPublishPanel );
