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

	if ( ! enabledControls.length && ! unavailableControls.length ) {
		return null;
	}

	/*
	 * A block whose alignments are all unavailable still needs somewhere to
	 * anchor them, and `None` is always a valid choice for it.
	 */
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
				toggleProps: description ? { description } : {},
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
														? __( 'Not available' )
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
