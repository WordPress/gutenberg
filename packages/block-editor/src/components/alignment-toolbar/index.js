/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { ToolbarGroup } from '@wordpress/components';
import { alignLeft, alignRight, alignCenter } from '@wordpress/icons';

const DEFAULT_ALIGNMENT_CONTROLS = [
	{
		icon: alignLeft,
		title: __( 'Align text left' ),
		align: 'left',
	},
	{
		icon: alignCenter,
		title: __( 'Align text center' ),
		align: 'center',
	},
	{
		icon: alignRight,
		title: __( 'Align text right' ),
		align: 'right',
	},
];

const POPOVER_PROPS = {
	position: 'bottom right',
	isAlternate: true,
};

export function AlignmentToolbar( props ) {
	const {
		value,
		onChange,
		alignmentControls = DEFAULT_ALIGNMENT_CONTROLS,
		label = __( 'Change text alignment' ),
		isCollapsed = true,
	} = props;

	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	const activeAlignment = find(
		alignmentControls,
		( control ) => control.align === value
	);

	function setIcon() {
		if ( activeAlignment ) return activeAlignment.icon;
		return isRTL() ? alignRight : alignLeft;
	}

	return (
		<ToolbarGroup
			isCollapsed={ isCollapsed }
			icon={ setIcon() }
			label={ label }
			popoverProps={ POPOVER_PROPS }
			controls={ alignmentControls.map( ( control ) => {
				const { align } = control;
				const isActive = value === align;

				return {
					...control,
					isActive,
					role: isCollapsed ? 'menuitemradio' : undefined,
					onClick: applyOrUnset( align ),
				};
			} ) }
		/>
	);
}

export default AlignmentToolbar;
