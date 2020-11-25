/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarGroup } from '@wordpress/components';
import {
	positionCenter,
	stretchFullWidth,
	stretchWide,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useLayout } from '../inner-blocks/layout';

const POSITION_CONTROLS = {
	center: {
		icon: positionCenter,
		title: __( 'Center' ),
	},
	wide: {
		icon: stretchWide,
		title: __( 'Wide' ),
	},
	full: {
		icon: stretchFullWidth,
		title: __( 'Full' ),
	},
};

const DEFAULT_CONTROL = 'center';

const POPOVER_PROPS = {
	isAlternate: true,
};

export function GridPositionToolbar( { value, onChange, isCollapsed = true } ) {
	const layout = useLayout();
	const supportsGrid = layout.type === 'grid';

	if ( ! supportsGrid ) {
		return null;
	}

	function applyOrUnset( align ) {
		return () =>
			onChange(
				value === align || value === DEFAULT_CONTROL ? undefined : align
			);
	}

	const activeAlignmentControl = POSITION_CONTROLS[ value ];
	const defaultAlignmentControl = POSITION_CONTROLS[ DEFAULT_CONTROL ];

	return (
		<ToolbarGroup
			popoverProps={ POPOVER_PROPS }
			isCollapsed={ isCollapsed }
			icon={
				activeAlignmentControl
					? activeAlignmentControl.icon
					: defaultAlignmentControl.icon
			}
			label={ __( 'Change position' ) }
			controls={ Object.keys( POSITION_CONTROLS ).map( ( control ) => {
				return {
					...POSITION_CONTROLS[ control ],
					isActive: value === control,
					role: isCollapsed ? 'menuitemradio' : undefined,
					onClick: applyOrUnset( control ),
				};
			} ) }
		/>
	);
}

export default GridPositionToolbar;
