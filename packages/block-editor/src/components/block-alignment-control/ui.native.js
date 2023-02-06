/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	ToolbarDropdownMenu,
	ToolbarGroup,
	BottomSheetSelectControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import useAvailableAlignments from './use-available-alignments';
import {
	BLOCK_ALIGNMENTS_CONTROLS,
	DEFAULT_CONTROL,
	POPOVER_PROPS,
} from './constants';

function BlockAlignmentUI( {
	value,
	onChange,
	controls,
	isToolbar,
	isCollapsed = true,
	isBottomSheetControl = false,
} ) {
	const enabledControls = useAvailableAlignments( controls );
	const hasEnabledControls = !! enabledControls.length;

	if ( ! hasEnabledControls ) {
		return null;
	}

	function onChangeAlignment( align ) {
		onChange( [ value, 'none' ].includes( align ) ? undefined : align );
	}

	const activeAlignmentControl = BLOCK_ALIGNMENTS_CONTROLS[ value ];
	const defaultAlignmentControl =
		BLOCK_ALIGNMENTS_CONTROLS[ DEFAULT_CONTROL ];

	const toolbarUIComponent = isToolbar ? ToolbarGroup : ToolbarDropdownMenu;
	const UIComponent = isBottomSheetControl
		? BottomSheetSelectControl
		: toolbarUIComponent;

	const commonProps = {
		label: __( 'Align' ),
	};
	const extraProps = isBottomSheetControl
		? {
				options: enabledControls.map( ( { name: controlName } ) => {
					const control = BLOCK_ALIGNMENTS_CONTROLS[ controlName ];
					return {
						value: controlName,
						label: control.title,
						icon: control.icon,
					};
				} ),
				value: activeAlignmentControl ? value : 'none',
				onChange: ( align ) => onChangeAlignment( align ),
		  }
		: {
				icon: activeAlignmentControl
					? activeAlignmentControl.icon
					: defaultAlignmentControl.icon,
				isCollapsed: isToolbar ? isCollapsed : undefined,
				controls: enabledControls.map( ( { name: controlName } ) => {
					return {
						...BLOCK_ALIGNMENTS_CONTROLS[ controlName ],
						isActive:
							value === controlName ||
							( ! value && controlName === 'none' ),
						onClick: () => onChangeAlignment( controlName ),
					};
				} ),
				popoverProps: POPOVER_PROPS,
				toggleProps: { describedBy: __( 'Change alignment' ) },
		  };

	return <UIComponent { ...commonProps } { ...extraProps } />;
}

export default BlockAlignmentUI;
