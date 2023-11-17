/**
 * WordPress dependencies
 */
import { Button, Dropdown } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PostScheduleCheck from './check';
import PostScheduleForm from './index';
import { usePostScheduleLabel } from './label';
import PostPanelRow from '../post-panel-row';

export default function PostSchedulePanel() {
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			'aria-label': __( 'Change publish date' ),
			placement: 'bottom-end',
		} ),
		[ popoverAnchor ]
	);

	const label = usePostScheduleLabel();
	const fullLabel = usePostScheduleLabel( { full: true } );

	return (
		<PostScheduleCheck>
			<PostPanelRow label={ __( 'Publish' ) } ref={ setPopoverAnchor }>
				<Dropdown
					popoverProps={ popoverProps }
					focusOnMount
					className="editor-post-schedule__panel-dropdown"
					contentClassName="editor-post-schedule__dialog"
					renderToggle={ ( { onToggle, isOpen } ) => (
						<Button
							className="editor-post-schedule__dialog-toggle"
							variant="tertiary"
							onClick={ onToggle }
							aria-label={ sprintf(
								// translators: %s: Current post date.
								__( 'Change date: %s' ),
								label
							) }
							label={ fullLabel }
							showTooltip
							aria-expanded={ isOpen }
						>
							{ label }
						</Button>
					) }
					renderContent={ ( { onClose } ) => (
						<PostScheduleForm onClose={ onClose } />
					) }
				/>
			</PostPanelRow>
		</PostScheduleCheck>
	);
}
