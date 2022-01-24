/**
 * External dependencies
 */
import type { Ref } from 'react';

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

const noop = () => {};

const DefaultControlsGroup = ( {
	items,
	onClose,
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
						disabled={ ! hasValue }
						label={ itemLabel }
						onClick={ () => {
							toggleItem( label );
							onClose();
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

const OptionalControlsGroup = ( {
	items,
	onClose,
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
							onClose();
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
	forwardedRef: Ref< any >
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
	const dropDownMenuLabelText = areAllOptionalControlsHidden
		? _x(
				'View and add options',
				'Button label to reveal tool panel options'
		  )
		: _x( 'View options', 'Button label to reveal tool panel options' );

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
					toggleProps={ { isSmall: true } }
				>
					{ ( { onClose = noop } ) => (
						<>
							<DefaultControlsGroup
								items={ defaultItems }
								onClose={ onClose }
								toggleItem={ toggleItem }
							/>
							<OptionalControlsGroup
								items={ optionalItems }
								onClose={ onClose }
								toggleItem={ toggleItem }
							/>
							<MenuGroup>
								<MenuItem
									variant={ 'tertiary' }
									onClick={ () => {
										resetAll();
										onClose();
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
