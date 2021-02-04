/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarGroup } from '@wordpress/components';
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

export function BlockAlignmentToolbar( {
	value,
	onChange,
	controls = DEFAULT_CONTROLS,
	isCollapsed = true,
} ) {
	const { wideControlsEnabled = false } = useSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		const settings = getSettings();
		return {
			wideControlsEnabled: settings.alignWide,
		};
	} );
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

	return (
		<ToolbarGroup
			popoverProps={ POPOVER_PROPS }
			isCollapsed={ isCollapsed }
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
		/>
	);
}

export default BlockAlignmentToolbar;
