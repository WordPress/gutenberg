/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Dropdown, Button } from '@wordpress/components';
import {
	PostSchedule as PostScheduleForm,
	PostScheduleLabel,
	PostScheduleCheck,
} from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';

export function PostSchedule() {
	const allowUnschedule = useSelect(
		( select ) =>
			! select( 'core/editor' ).isEditedPostDateFloating() &&
			! select( 'core/editor' ).isCurrentPostScheduled() &&
			! select( 'core/editor' ).isCurrentPostPublished(),
		[]
	);
	const { editPost } = useDispatch( 'core/editor' );
	return (
		<PostScheduleCheck>
			<PanelRow className="edit-post-post-schedule">
				<span>{ __( 'Publish' ) }</span>
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
			{ allowUnschedule && (
				<PanelRow className="edit-post-post-unschedule">
					<Button
						isSmall
						isSecondary
						onClick={ () => editPost( { date: null } ) }
					>
						{ __( 'Unschedule' ) }
					</Button>
				</PanelRow>
			) }
		</PostScheduleCheck>
	);
}

export default PostSchedule;
