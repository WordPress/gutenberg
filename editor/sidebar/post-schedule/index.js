/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Dropdown, withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import PostScheduleLabel from '../../post-schedule/label';
import PostScheduleForm from '../../post-schedule';

export function PostSchedule( { user } ) {
	if ( ! user.data || ! user.data.capabilities.publish_posts ) {
		return null;
	}
	const scheduleId = 'post-schedule-selector';

	return (
		<PanelRow className="editor-post-schedule">
			<label htmlFor={ scheduleId }>{ __( 'Publish' ) }</label>
			<Dropdown
				position="bottom left"
				contentClassName="editor-post-schedule__dialog"
				renderToggle={ ( { onToggle, isOpen } ) => (
					<button
						type="button"
						className="editor-post-schedule__toggle button-link"
						onClick={ onToggle }
						aria-expanded={ isOpen }
					>
						<PostScheduleLabel />
					</button>
				) }
				renderContent={ () => <PostScheduleForm /> }
			/>
		</PanelRow>
	);
}

export default withAPIData( () => {
	return {
		user: '/wp/v2/users/me?context=edit',
	};
} )( PostSchedule );
