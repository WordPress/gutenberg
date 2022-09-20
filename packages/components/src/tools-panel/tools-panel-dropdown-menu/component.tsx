/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { check, reset, moreVertical, plus } from '@wordpress/icons';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DropdownMenu from '../../dropdown-menu';
import MenuGroup from '../../menu-group';
import MenuItem from '../../menu-item';
import { useToolsPanelDropdownMenu } from './hook';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import type {
	ToolsPanelControlsGroupProps,
	ToolsPanelDropdownMenuProps,
} from '../types';

const DefaultControlsGroup = ( {
	items,
	toggleItem,
}: ToolsPanelControlsGroupProps ) => {
	if ( ! items.length ) {
		return null;
	}

	return (
		<MenuGroup>
			{ items.map( ( [ label, hasValue ] ) => {
				if ( hasValue ) {
					return (
						<MenuItem
							key={ label }
							role="menuitem"
							icon={ reset }
							label={ sprintf(
								// translators: %s: The name of the control being reset e.g. "Padding".
								__( 'Reset %s' ),
								label
							) }
							onClick={ () => {
								toggleItem( label );
								speak(
									sprintf(
										// translators: %s: The name of the control being reset e.g. "Padding".
										__( '%s reset to default' ),
										label
									),
									'assertive'
								);
							} }
						>
							{ label }
						</MenuItem>
					);
				}

				return (
					<MenuItem
						key={ label }
						role="menuitemcheckbox"
						icon={ check }
						isSelected
						aria-disabled
					>
						{ label }
					</MenuItem>
				);
			} ) }
		</MenuGroup>
	);
};

const OptionalControlsGroup = ( {
	items,
	toggleItem,
}: ToolsPanelControlsGroupProps ) => {
	if ( ! items.length ) {
		return null;
	}

	return (
		<MenuGroup>
			{ items.map( ( [ label, isSelected ] ) => {
				const itemLabel = isSelected
					? sprintf(
							// translators: %s: The name of the control being hidden and reset e.g. "Padding".
							__( 'Hide and reset %s' ),
							label
					  )
					: sprintf(
							// translators: %s: The name of the control to display e.g. "Padding".
							__( 'Show %s' ),
							label
					  );

				return (
					<MenuItem
						key={ label }
						icon={ isSelected && check }
						isSelected={ isSelected }
						label={ itemLabel }
						onClick={ () => {
							if ( isSelected ) {
								speak(
									sprintf(
										// translators: %s: The name of the control being reset e.g. "Padding".
										__( '%s hidden and reset to default' ),
										label
									),
									'assertive'
								);
							} else {
								speak(
									sprintf(
										// translators: %s: The name of the control being reset e.g. "Padding".
										__( '%s is now visible' ),
										label
									),
									'assertive'
								);
							}
							toggleItem( label );
						} }
						role="menuitemcheckbox"
					>
						{ label }
					</MenuItem>
				);
			} ) }
		</MenuGroup>
	);
};

const ToolsPanelDropdownMenu = (
	props: WordPressComponentProps< ToolsPanelDropdownMenuProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) => {
	const {
		areAllOptionalControlsHidden,
		dropdownMenuClassName,
		hasMenuItems,
		label,
		menuItems,
		resetAll,
		toggleItem,
		...dropdownMenuProps
	} = useToolsPanelDropdownMenu( props );

	if ( ! label || ! hasMenuItems ) {
		return null;
	}

	const defaultItems = Object.entries( menuItems?.default || {} );
	const optionalItems = Object.entries( menuItems?.optional || {} );
	const dropDownMenuIcon = areAllOptionalControlsHidden ? plus : moreVertical;
	const dropdownMenuDescriptionText = areAllOptionalControlsHidden
		? __( 'All options are currently hidden' )
		: undefined;

	const canResetAll = [ ...defaultItems, ...optionalItems ].some(
		( [ , isSelected ] ) => isSelected
	);

	return (
		<DropdownMenu
			ref={ forwardedRef }
			icon={ dropDownMenuIcon }
			label={ label }
			menuProps={ { className: dropdownMenuClassName } }
			toggleProps={ {
				isSmall: true,
				describedBy: dropdownMenuDescriptionText,
			} }
			{ ...dropdownMenuProps }
		>
			{ () => (
				<>
					<DefaultControlsGroup
						items={ defaultItems }
						toggleItem={ toggleItem }
					/>
					<OptionalControlsGroup
						items={ optionalItems }
						toggleItem={ toggleItem }
					/>
					<MenuGroup>
						<MenuItem
							aria-disabled={ ! canResetAll }
							variant={ 'tertiary' }
							onClick={ () => {
								if ( canResetAll ) {
									resetAll();
									speak(
										__( 'All options reset' ),
										'assertive'
									);
								}
							} }
						>
							{ __( 'Reset all' ) }
						</MenuItem>
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
};

const ConnectedToolsPanelDropdownMenu = contextConnect(
	ToolsPanelDropdownMenu,
	'ToolsPanelDropdownMenu'
);

export default ConnectedToolsPanelDropdownMenu;
