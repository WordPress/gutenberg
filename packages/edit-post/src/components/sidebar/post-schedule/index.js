/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Dropdown, Button } from '@wordpress/components';
import {
	PostSchedule as PostScheduleForm,
	PostScheduleCheck,
	usePostScheduleLabel,
} from '@wordpress/editor';

export default function PostSchedule() {
	return (
		<PostScheduleCheck>
			<span>{ __( 'Publish' ) }</span>
			<Dropdown
				position="bottom left"
				contentClassName="edit-post-post-schedule__dialog"
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
