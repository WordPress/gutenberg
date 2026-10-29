import { __, isRTL } from '@wordpress/i18n';
import { ToolbarDropdownMenu, ToolbarGroup } from '@wordpress/components';
import { alignLeft, alignRight, alignCenter } from '@wordpress/icons';
import type { ComponentProps, ComponentType } from 'react';
import type { AlignmentControlOption, AlignmentUIProps } from './types';

const DEFAULT_ALIGNMENT_CONTROLS: AlignmentControlOption[] = [
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
	placement: 'bottom-start' as const,
};

function AlignmentUI( {
	value,
	onChange,
	alignmentControls = DEFAULT_ALIGNMENT_CONTROLS,
	label = __( 'Align text' ),
	description,
	isCollapsed = true,
	isToolbar,
}: AlignmentUIProps ) {
	function applyOrUnset( align: string ) {
		return () => onChange( value === align ? undefined : align );
	}

	const activeAlignment = alignmentControls.find(
		( control ) => control.align === value
	);

	function setIcon() {
		if ( activeAlignment ) {
			return activeAlignment.icon;
		}
		return isRTL() ? alignRight : alignLeft;
	}

	// Both take the controls; the extra props match the one rendered.
	const UIComponent = (
		isToolbar ? ToolbarGroup : ToolbarDropdownMenu
	) as ComponentType< ComponentProps< typeof ToolbarDropdownMenu > >;
	const extraProps = isToolbar
		? { isCollapsed }
		: {
				toggleProps: description ? { description } : {},
				popoverProps: POPOVER_PROPS,
			};

	return (
		<UIComponent
			icon={ setIcon() }
			label={ label }
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
			{ ...extraProps }
		/>
	);
}

export default AlignmentUI;
