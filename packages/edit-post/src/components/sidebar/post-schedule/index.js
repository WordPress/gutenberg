/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Dropdown, Button } from '@wordpress/components';
import { useRef } from '@wordpress/element';
import {
	PostSchedule as PostScheduleForm,
	PostScheduleLabel,
	PostScheduleCheck,
	usePostScheduleLabel,
} from '@wordpress/editor';

export default function PostSchedule() {
	const anchorRef = useRef();

	const fullLabel = usePostScheduleLabel( { full: true } );

	return (
		<PostScheduleCheck>
			<PanelRow className="edit-post-post-schedule" ref={ anchorRef }>
				<span>{ __( 'Publish' ) }</span>
				<Dropdown
					popoverProps={ { anchorRef } }
					position="bottom left"
					contentClassName="edit-post-post-schedule__dialog"
					renderToggle={ ( { onToggle, isOpen } ) => (
						<>
							<Button
								className="edit-post-post-schedule__toggle"
								onClick={ onToggle }
								aria-expanded={ isOpen }
								variant="tertiary"
								label={ fullLabel }
							>
								<PostScheduleLabel />
							</Button>
						</>
					) }
					renderContent={ ( { onClose } ) => (
						<PostScheduleForm onClose={ onClose } />
					) }
				/>
			</PanelRow>
		</PostScheduleCheck>
	);
}
