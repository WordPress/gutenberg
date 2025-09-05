/**
 * WordPress dependencies
 */
import { Button, Dropdown } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostScheduleCheck from './check';
import PostScheduleForm from './index';
import { usePostScheduleLabel } from './label';
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_POST_TYPE,
	NAVIGATION_POST_TYPE,
} from '../../store/constants';

const DESIGN_POST_TYPES = [
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_POST_TYPE,
	NAVIGATION_POST_TYPE,
];

/**
 * Renders the Post Schedule Panel component.
 *
 * @return {React.ReactNode} The rendered component.
 */
export default function PostSchedulePanel() {
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const postType = useSelect(
		( select ) => select( editorStore ).getCurrentPostType(),
		[]
	);
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			'aria-label': __( 'Change publish date' ),
			placement: 'left-start',
			offset: 36,
			shift: true,
		} ),
		[ popoverAnchor ]
	);

	const label = usePostScheduleLabel();
	const fullLabel = usePostScheduleLabel( { full: true } );
	if ( DESIGN_POST_TYPES.includes( postType ) ) {
		return null;
	}

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
							size="compact"
							className="editor-post-schedule__dialog-toggle"
							variant="tertiary"
							tooltipPosition="middle left"
							onClick={ onToggle }
							aria-label={ sprintf(
								// translators: %s: Current post date.
								__( 'Change date: %s' ),
								label
							) }
							label={ fullLabel }
							showTooltip={ label !== fullLabel }
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
