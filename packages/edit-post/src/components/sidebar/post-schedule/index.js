/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Dropdown, Button } from '@wordpress/components';
import { PostSchedule as PostScheduleForm, PostScheduleLabel, PostScheduleCheck } from '@wordpress/editor';
import { withSelect, withDispatch } from '@wordpress/data';

import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';

class PostSchedule extends Component {
	constructor( props ) {
		super( props );
		this.unscheduleAction = this.unscheduleAction.bind( this );
	}

	unscheduleAction() {
		this.props.editDate( this.props.modified );
	}

	render() {
		return (
			<PostScheduleCheck>
				<PanelRow className="edit-post-post-schedule">
					<span>
						{ __( 'Publish' ) }
					</span>
					<Dropdown
						position="bottom left"
						contentClassName="edit-post-post-schedule__dialog"
						renderToggle={ ( { onToggle, isOpen } ) => (
							<>
								<Button
									type="button"
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
				{ this.props.isScheduled === true &&
					<PanelRow className="edit-post-post-unschedule">
						<Button
							isSmall
							isDefault
							onClick={ this.unscheduleAction }
						>
							{ __( 'Unschedule' ) }
						</Button>
					</PanelRow>
				}
			</PostScheduleCheck>
		);
	}
}

PostSchedule = compose( [
	withSelect( ( select ) => {
		return {
			status: select( 'core/editor' ).getEditedPostAttribute( 'status' ),
			date: select( 'core/editor' ).getEditedPostAttribute( 'date' ),
			modified: select( 'core/editor' ).getEditedPostAttribute( 'modified' ),
			isScheduled: select( 'core/editor' ).isEditedPostBeingScheduled(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost } = dispatch( 'core/editor' );
		return {
			editDate( date ) {
				editPost( { date } );
			},
		};
	} ),
] )( PostSchedule );

export default PostSchedule;
