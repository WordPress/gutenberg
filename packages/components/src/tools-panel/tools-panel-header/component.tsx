/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { check, reset, moreVertical, plus } from '@wordpress/icons';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DropdownMenu from '../../dropdown-menu';
import MenuGroup from '../../menu-group';
import MenuItem from '../../menu-item';
import { HStack } from '../../h-stack';
import { Heading } from '../../heading';
import { useToolsPanelHeader } from './hook';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import type {
	ToolsPanelControlsGroupProps,
	ToolsPanelHeaderProps,
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
				const icon = hasValue ? reset : check;
				const itemLabel = hasValue
					? sprintf(
							// translators: %s: The name of the control being reset e.g. "Padding".
							__( 'Reset %s' ),
							label
					  )
					: undefined;

				return (
					<MenuItem
						key={ label }
						icon={ icon }
						isSelected={ true }
						aria-disabled={ ! hasValue }
						label={ itemLabel }
						onClick={ () => {
							if ( ! hasValue ) {
								return;
							}
							toggleItem( label );
						} }
						role={ hasValue ? 'menuitem' : 'menuitemcheckbox' }
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

const ToolsPanelHeader = (
	props: WordPressComponentProps< ToolsPanelHeaderProps, 'h2' >,
	forwardedRef: ForwardedRef< any >
) => {
	const {
		areAllOptionalControlsHidden,
		dropdownMenuClassName,
		hasMenuItems,
		headingClassName,
		label: labelText,
		menuItems,
		resetAll,
		toggleItem,
		...headerProps
	} = useToolsPanelHeader( props );

	if ( ! labelText ) {
		return null;
	}

	const defaultItems = Object.entries( menuItems?.default || {} );
	const optionalItems = Object.entries( menuItems?.optional || {} );
	const dropDownMenuIcon = areAllOptionalControlsHidden ? plus : moreVertical;
	const dropDownMenuLabelText = sprintf(
		// translators: %s: The name of the tool e.g. "Color" or "Typography".
		_x( '%s options', 'Button label to reveal tool panel options' ),
		labelText
	);
	const dropdownMenuDescriptionText = areAllOptionalControlsHidden
		? // translators: 'control' as in a user interface control.
		  __( 'All controls are currently hidden' )
		: undefined;

	return (
		<HStack { ...headerProps } ref={ forwardedRef }>
			<Heading level={ 2 } className={ headingClassName }>
				{ labelText }
			</Heading>
			{ hasMenuItems && (
				<DropdownMenu
					icon={ dropDownMenuIcon }
					label={ dropDownMenuLabelText }
					menuProps={ { className: dropdownMenuClassName } }
					toggleProps={ {
						isSmall: true,
						describedBy: dropdownMenuDescriptionText,
					} }
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
									variant={ 'tertiary' }
									onClick={ () => {
										resetAll();
									} }
								>
									{ __( 'Reset all' ) }
								</MenuItem>
							</MenuGroup>
						</>
					) }
				</DropdownMenu>
			) }
		</HStack>
	);
};

const ConnectedToolsPanelHeader = contextConnect(
	ToolsPanelHeader,
	'ToolsPanelHeader'
);

export default ConnectedToolsPanelHeader;
