/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarDropdownMenu, ToolbarGroup } from '@wordpress/components';
import {
	positionCenter,
	positionLeft,
	positionRight,
	stretchFullWidth,
	stretchWide,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useAvailableAlignments from './use-available-alignments';

const BLOCK_ALIGNMENTS_CONTROLS = {
	left: {
		icon: positionLeft,
		title: __( 'Align left' ),
	},
	center: {
		icon: positionCenter,
		title: __( 'Align center' ),
	},
	right: {
		icon: positionRight,
		title: __( 'Align right' ),
	},
	wide: {
		icon: stretchWide,
		title: __( 'Wide width' ),
	},
	full: {
		icon: stretchFullWidth,
		title: __( 'Full width' ),
	},
};

const DEFAULT_CONTROL = 'center';

const POPOVER_PROPS = {
	isAlternate: true,
};

function BlockAlignmentUI( {
	value,
	onChange,
	controls,
	isToolbar,
	isCollapsed = true,
} ) {
	const enabledControls = useAvailableAlignments( controls );
	if ( enabledControls.length === 0 ) {
		return null;
	}

	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	const activeAlignmentControl = BLOCK_ALIGNMENTS_CONTROLS[ value ];
	const defaultAlignmentControl =
		BLOCK_ALIGNMENTS_CONTROLS[ DEFAULT_CONTROL ];

	const UIComponent = isToolbar ? ToolbarGroup : ToolbarDropdownMenu;
	const extraProps = isToolbar ? { isCollapsed } : {};

	return (
		<UIComponent
			popoverProps={ POPOVER_PROPS }
			icon={
				activeAlignmentControl
					? activeAlignmentControl.icon
					: defaultAlignmentControl.icon
			}
			label={ __( 'Align' ) }
			toggleProps={ { describedBy: __( 'Change alignment' ) } }
			controls={ enabledControls.map( ( control ) => {
				return {
					...BLOCK_ALIGNMENTS_CONTROLS[ control ],
					isActive: value === control,
					role: isCollapsed ? 'menuitemradio' : undefined,
					onClick: applyOrUnset( control ),
				};
			} ) }
			{ ...extraProps }
		/>
	);
}

export default BlockAlignmentUI;
