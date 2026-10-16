import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import {
	ToolbarDropdownMenu,
	ToolbarGroup,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { useAlignmentMenu } from './use-available-alignments';
import { BLOCK_ALIGNMENTS_CONTROLS, DEFAULT_CONTROL } from './constants';

function getUnavailableInfo( isSelected ) {
	// A withheld alignment that is also the value is set but has no effect,
	// which is a different thing to tell the user than that it can't be picked.
	return isSelected ? __( 'Not applied here' ) : __( 'Not available' );
}

function BlockAlignmentUI( {
	value,
	onChange,
	controls,
	isToolbar,
	isCollapsed = true,
	label = __( 'Align block' ),
	description,
} ) {
	/*
	 * Wide and Full are the alignments users look for and fail to find. When a
	 * parent layout does not offer them they disappear from this menu with no
	 * explanation, which reads as the editor losing the setting. List them as
	 * unavailable instead, so the menu says why it cannot do what was asked.
	 */
	const { enabled: enabledControls, unavailable: unavailableControls } =
		useAlignmentMenu( controls );

	/*
	 * The saved alignment can be one the parent layout withholds, typically a
	 * full-width pattern inserted into a layout that offers no full width. The
	 * block then renders unaligned in the editor while its saved markup keeps
	 * the class, so the menu has to stay reachable to show that and to clear it.
	 */
	const isValueUnavailable =
		!! value && unavailableControls.includes( value );

	// A menu of nothing but unavailable options could never change anything,
	// unless one of them is the value and `none` is there to remove it.
	if ( ! enabledControls.length && ( isToolbar || ! isValueUnavailable ) ) {
		return null;
	}

	const menuControls = enabledControls.length
		? [ ...enabledControls ]
		: [ { name: 'none' } ];
	const enabledNames = menuControls.map( ( { name } ) => name );

	// Unavailable alignments sit where they would have sat had they been
	// offered, which is directly after `none`.
	menuControls.splice(
		enabledNames.indexOf( 'none' ) + 1,
		0,
		...unavailableControls.map( ( name ) => ( {
			name,
			isUnavailable: true,
		} ) )
	);

	function onChangeAlignment( align ) {
		onChange( [ value, 'none' ].includes( align ) ? undefined : align );
	}

	const activeAlignmentControl = BLOCK_ALIGNMENTS_CONTROLS[ value ];
	const defaultAlignmentControl =
		BLOCK_ALIGNMENTS_CONTROLS[ DEFAULT_CONTROL ];

	const toggleDescription =
		description ??
		( isValueUnavailable
			? __(
					'The surrounding layout stops this alignment from taking effect. Choose None to remove it.'
				)
			: undefined );

	const UIComponent = isToolbar ? ToolbarGroup : ToolbarDropdownMenu;
	const commonProps = {
		icon: activeAlignmentControl
			? activeAlignmentControl.icon
			: defaultAlignmentControl.icon,
		label,
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
				toggleProps: toggleDescription
					? { description: toggleDescription }
					: {},
				children: ( { onClose } ) => {
					return (
						<>
							<MenuGroup className="block-editor-block-alignment-control__menu-group">
								{ menuControls.map(
									( {
										name: controlName,
										info,
										isUnavailable,
									} ) => {
										const { icon, title } =
											BLOCK_ALIGNMENTS_CONTROLS[
												controlName
											];
										// If no value is provided, mark as selected the `none` option.
										// An unavailable alignment can still be the saved value, and
										// showing it as selected is how the menu says the setting
										// exists but has no effect in this position.
										const isSelected =
											controlName === value ||
											( ! value &&
												controlName === 'none' );
										return (
											<MenuItem
												key={ controlName }
												icon={ icon }
												iconPosition="left"
												className={ clsx(
													'components-dropdown-menu__menu-item',
													{
														'is-active': isSelected,
													}
												) }
												isSelected={ isSelected }
												disabled={ isUnavailable }
												onClick={ () => {
													onChangeAlignment(
														controlName
													);
													onClose();
												} }
												role="menuitemradio"
												info={
													isUnavailable
														? getUnavailableInfo(
																isSelected
															)
														: info
												}
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
