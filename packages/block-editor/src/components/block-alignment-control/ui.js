/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	ToolbarDropdownMenu,
	ToolbarGroup,
	MenuGroup,
	MenuItem,
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

	const UIComponent = isToolbar ? ToolbarGroup : ToolbarDropdownMenu;
	const commonProps = {
		icon: activeAlignmentControl
			? activeAlignmentControl.icon
			: defaultAlignmentControl.icon,
		label: __( 'Align' ),
	};
	const extraProps = isToolbar
		? {
				isCollapsed,
				controls: enabledControls.map( ( { name: controlName } ) => {
					return {
						...BLOCK_ALIGNMENTS_CONTROLS[ controlName ],
						isActive:
							value === controlName ||
							( ! value && controlName === 'none' ),
						role: isCollapsed ? 'menuitemradio' : undefined,
						onClick: () => onChangeAlignment( controlName ),
					};
				} ),
		  }
		: {
				toggleProps: { describedBy: __( 'Change alignment' ) },
				popoverProps: POPOVER_PROPS,
				children: ( { onClose } ) => {
					return (
						<>
							<MenuGroup className="block-editor-block-alignment-control__menu-group">
								{ enabledControls.map(
									( { name: controlName, info } ) => {
										const { icon, title } =
											BLOCK_ALIGNMENTS_CONTROLS[
												controlName
											];
										// If no value is provided, mark as selected the `none` option.
										const isSelected =
											controlName === value ||
											( ! value &&
												controlName === 'none' );
										return (
											<MenuItem
												key={ controlName }
												icon={ icon }
												iconPosition="left"
												className={ classNames(
													'components-dropdown-menu__menu-item',
													{
														'is-active': isSelected,
													}
												) }
												isSelected={ isSelected }
												onClick={ () => {
													onChangeAlignment(
														controlName
													);
													onClose();
												} }
												role="menuitemradio"
												info={ info }
											>
												{ title }
											</MenuItem>
										);
									}
								) }
							</MenuGroup>
						</>
					);
				},
		  };

	return <UIComponent { ...commonProps } { ...extraProps } />;
}

export default BlockAlignmentUI;
