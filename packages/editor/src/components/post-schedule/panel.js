/**
 * WordPress dependencies
 */
import {
	Button,
	Dropdown,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import { humanTimeDiff } from '@wordpress/date';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostScheduleCheck from './check';
import PostScheduleForm from './index';
import { store as editorStore } from '../../store';
import { usePostScheduleLabel } from './label';

export default function PostSchedulePanel() {
	const { date } = useSelect(
		( select ) => ( {
			date: select( editorStore ).getEditedPostAttribute( 'date' ),
		} ),
		[]
	);

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

	const relateToNow = date ? humanTimeDiff( date ) : __( 'Immediately' );
	const label = usePostScheduleLabel();

	return (
		<PostScheduleCheck>
			<HStack
				className="editor-post-schedule__panel"
				ref={ setPopoverAnchor }
			>
				<span>{ __( 'Publish' ) }</span>
				<Dropdown
					popoverProps={ popoverProps }
					focusOnMount
					className="editor-post-schedule__panel-dropdown"
					contentClassName="editor-post-schedule__dialog"
					renderToggle={ ( { onToggle } ) => (
						<Button
							className="editor-post-schedule__dialog-toggle"
							variant="tertiary"
							onClick={ onToggle }
							aria-label={ sprintf(
								// translators: %s: Current post date.
								__( 'Change date: %s' ),
								label
							) }
						>
							{ relateToNow }
						</Button>
					) }
					renderContent={ ( { onClose } ) => (
						<PostScheduleForm onClose={ onClose } />
					) }
				/>
			</HStack>
		</PostScheduleCheck>
	);
}
