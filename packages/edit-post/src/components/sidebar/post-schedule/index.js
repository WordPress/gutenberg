/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { PanelRow, Dropdown, Button } from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import {
	PostSchedule as PostScheduleForm,
	PostScheduleCheck,
	usePostScheduleLabel,
} from '@wordpress/editor';

export default function PostSchedule() {
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( { anchor: popoverAnchor, placement: 'bottom-end' } ),
		[ popoverAnchor ]
	);

	return (
		<PostScheduleCheck>
			<PanelRow
				className="edit-post-post-schedule"
				ref={ setPopoverAnchor }
			>
				<span>{ __( 'Publish' ) }</span>
				<Dropdown
					popoverProps={ popoverProps }
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
