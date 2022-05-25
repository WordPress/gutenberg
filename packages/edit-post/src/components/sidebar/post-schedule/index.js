/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Dropdown, Button } from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	PostSchedule as PostScheduleForm,
	PostScheduleLabel,
	PostScheduleCheck,
	PostSwitchToDraftButton,
	store as editorStore,
} from '@wordpress/editor';

export function PostSchedule() {
	const anchorRef = useRef();
	const { status } = useSelect( ( select ) => ( {
		status: select( editorStore ).getEditedPostAttribute( 'status' ),
	} ) );

	return (
		<PostScheduleCheck>
			<PanelRow className="edit-post-post-schedule" ref={ anchorRef }>
				<span>{ __( 'Publish' ) }</span>
				<Dropdown
					popoverProps={ { anchorRef: anchorRef.current } }
					position="bottom left"
					contentClassName="edit-post-post-schedule__dialog"
					renderToggle={ ( { onToggle, isOpen } ) => (
						<>
							<Button
								className="edit-post-post-schedule__toggle"
								onClick={ onToggle }
								aria-expanded={ isOpen }
								variant="tertiary"
							>
								<PostScheduleLabel />
							</Button>
						</>
					) }
					renderContent={ () => <PostScheduleForm /> }
				/>
			</PanelRow>
			{ ( status === 'publish' || status === 'future' ) && (
				<PostSwitchToDraftButton />
			) }
		</PostScheduleCheck>
	);
}

export default PostSchedule;
