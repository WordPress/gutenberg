/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { PanelRow, Dropdown, Button } from '@wordpress/components';
import { useRef } from '@wordpress/element';
import {
	PostSchedule as PostScheduleForm,
	PostScheduleCheck,
	usePostScheduleLabel,
} from '@wordpress/editor';

export default function PostSchedule() {
	const anchorRef = useRef();
	return (
		<PostScheduleCheck>
			<PanelRow className="edit-post-post-schedule" ref={ anchorRef }>
				<span>{ __( 'Publish' ) }</span>
				<Dropdown
					popoverProps={ { anchorRef } }
					position="bottom left"
					contentClassName="edit-post-post-schedule__dialog"
					focusOnMount
					renderToggle={ ( { isOpen, onToggle } ) => (
						<PostScheduleToggle
							isOpen={ isOpen }
							onClick={ onToggle }
						/>
					) }
					renderContent={ ( { onClose } ) => (
						<PostScheduleForm onClose={ onClose } />
					) }
				/>
			</PanelRow>
		</PostScheduleCheck>
	);
}

function PostScheduleToggle( { isOpen, onClick } ) {
	const label = usePostScheduleLabel();
	const fullLabel = usePostScheduleLabel( { full: true } );
	return (
		<Button
			className="edit-post-post-schedule__toggle"
			variant="tertiary"
			label={ fullLabel }
			showTooltip
			aria-expanded={ isOpen }
			// translators: %s: Current post date.
			aria-label={ sprintf( __( 'Change date: %s' ), label ) }
			onClick={ onClick }
		>
			{ label }
		</Button>
	);
}
