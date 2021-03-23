/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DropdownMenu, ToolbarGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
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
import { useLayout } from '../inner-blocks/layout';
import { store as blockEditorStore } from '../../store';

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

const DEFAULT_CONTROLS = [ 'left', 'center', 'right', 'wide', 'full' ];
const DEFAULT_CONTROL = 'center';
const WIDE_CONTROLS = [ 'wide', 'full' ];

const POPOVER_PROPS = {
	isAlternate: true,
};

function BlockAlignmentUI( {
	value,
	onChange,
	controls = DEFAULT_CONTROLS,
	isToolbar,
	isCollapsed = true,
	isToolbarButton = true,
} ) {
	const { wideControlsEnabled = false } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const settings = getSettings();
		return {
			wideControlsEnabled: settings.alignWide,
		};
	}, [] );
	const layout = useLayout();
	const supportsAlignments = layout.type === 'default';

	if ( ! supportsAlignments ) {
		return null;
	}

	const { alignments: availableAlignments = DEFAULT_CONTROLS } = layout;
	const enabledControls = controls.filter(
		( control ) =>
			( wideControlsEnabled || ! WIDE_CONTROLS.includes( control ) ) &&
			availableAlignments.includes( control )
	);

	if ( enabledControls.length === 0 ) {
		return null;
	}

	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	const activeAlignmentControl = BLOCK_ALIGNMENTS_CONTROLS[ value ];
	const defaultAlignmentControl =
		BLOCK_ALIGNMENTS_CONTROLS[ DEFAULT_CONTROL ];

	const UIComponent = isToolbar ? ToolbarGroup : DropdownMenu;
	const extraProps = isToolbar ? { isCollapsed } : { isToolbarButton };

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
