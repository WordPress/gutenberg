/**
 * WordPress dependencies
 */
import { PanelRow, Dropdown, Button } from '@wordpress/components';
import {
	PostSchedule as PostScheduleForm,
	PostScheduleLabel,
	PostScheduleCheck,
} from '@wordpress/editor';
import { withSelect } from '@wordpress/data';

export function PostSchedule( { publishActionText } ) {
	return (
		<PostScheduleCheck>
			<PanelRow className="edit-post-post-schedule">
				<span>{ publishActionText }</span>
				<Dropdown
					position="bottom left"
					contentClassName="edit-post-post-schedule__dialog"
					renderToggle={ ( { onToggle, isOpen } ) => (
						<>
							<Button
								className="edit-post-post-schedule__toggle"
								onClick={ onToggle }
								aria-expanded={ isOpen }
								isLink
							>
								<PostScheduleLabel />
							</Button>
						</>
					) }
					renderContent={ () => <PostScheduleForm /> }
				/>
			</PanelRow>
		</PostScheduleCheck>
	);
}

export default withSelect( ( select ) => {
	const { getSettings } = select( 'core/block-editor' );
	const { publishActionText } = getSettings();
	return {
		publishActionText,
	};
} )( PostSchedule );
