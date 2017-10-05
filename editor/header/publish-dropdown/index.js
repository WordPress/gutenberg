/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostVisibility from '../../sidebar/post-visibility';
import PostSchedule from '../../sidebar/post-schedule';
import PublishButton from '../publish-button';

function PublishDropdown( { onSubmit } ) {
	return (
		<div className="editor-publish-dropdown">
			<div><strong>{ __( 'All ready to go!' ) }</strong></div>
			<PostVisibility />
			<PostSchedule />
			<div className="editor-publish-dropdown__publish-button-container">
				<PublishButton onSubmit={ onSubmit } />
			</div>
		</div>
	);
}

export default PublishDropdown;
