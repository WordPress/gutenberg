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
import {
	alignNone,
	positionCenter,
	positionLeft,
	positionRight,
	stretchFullWidth,
	stretchWide,
} from '@wordpress/icons';
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useAvailableAlignments from './use-available-alignments';

const BLOCK_ALIGNMENTS_CONTROLS = {
	none: {
		icon: alignNone,
		title: __( 'None' ),
	},
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

const DEFAULT_CONTROL = 'none';

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
		popoverProps: POPOVER_PROPS,
		icon: activeAlignmentControl
			? activeAlignmentControl.icon
			: defaultAlignmentControl.icon,
		label: __( 'Align' ),
		toggleProps: { describedBy: __( 'Change alignment' ) },
	};
	const extraProps =
		isToolbar || Platform.isNative
			? {
					isCollapsed: isToolbar ? isCollapsed : undefined,
					controls: enabledControls.map(
						( { name: controlName } ) => {
							return {
								...BLOCK_ALIGNMENTS_CONTROLS[ controlName ],
								isActive:
									value === controlName ||
									( ! value && controlName === 'none' ),
								role: isCollapsed ? 'menuitemradio' : undefined,
								onClick: () => onChangeAlignment( controlName ),
							};
						}
					),
			  }
			: {
					children: ( { onClose } ) => {
						return (
							<>
								<MenuGroup className="block-editor-block-alignment-control__menu-group">
									{ enabledControls.map(
										( { name: controlName, info } ) => {
											const {
												icon,
												title,
											} = BLOCK_ALIGNMENTS_CONTROLS[
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
