/**
 * External dependencies
 */
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Dropdown, withAPIData, withInstanceId } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import PostScheduleLabel from '../../post-schedule/label';
import PostScheduleForm from '../../post-schedule';

export function PostSchedule( { user, instanceId } ) {
	if ( ! user.data || ! user.data.capabilities.publish_posts ) {
		return null;
	}
	const postScheduleSelectorId = 'post-schedule-selector-' + instanceId;

	return (
		<PanelRow className="editor-post-schedule">
			<label htmlFor={ postScheduleSelectorId }>{ __( 'Publish' ) }</label>
			<Dropdown
				position="bottom left"
				contentClassName="editor-post-schedule__dialog"
				renderToggle={ ( { onToggle, isOpen } ) => (
					<button
						id={ postScheduleSelectorId }
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

const applyWithAPIData = withAPIData( () => ( {
	user: '/wp/v2/users/me?context=edit',
} ) );

export default flowRight( [
	applyWithAPIData,
	withInstanceId,
] )( PostSchedule );
