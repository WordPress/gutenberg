/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { check, moreVertical, plus } from '@wordpress/icons';
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
import { ResetLabel } from '../styles';
import type {
	ToolsPanelControlsGroupProps,
	ToolsPanelHeaderProps,
} from '../types';

const DefaultControlsGroup = ( {
	itemClassName,
	items,
	toggleItem,
}: ToolsPanelControlsGroupProps ) => {
	if ( ! items.length ) {
		return null;
	}

	const resetSuffix = <ResetLabel aria-hidden>{ __( 'Reset' ) }</ResetLabel>;

	return (
		<MenuGroup label={ __( 'Defaults' ) }>
			{ items.map( ( [ label, hasValue ] ) => {
				if ( hasValue ) {
					return (
						<MenuItem
							key={ label }
							className={ itemClassName }
							role="menuitem"
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
							suffix={ resetSuffix }
						>
							{ label }
						</MenuItem>
					);
				}

				return (
					<MenuItem
						key={ label }
						className={ itemClassName }
						role="menuitemcheckbox"
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
		<MenuGroup label={ __( 'Tools' ) }>
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

const ToolsPanelHeader = (
	props: WordPressComponentProps< ToolsPanelHeaderProps, 'h2' >,
	forwardedRef: ForwardedRef< any >
) => {
	const {
		areAllOptionalControlsHidden,
		defaultControlsItemClassName,
		dropdownMenuClassName,
		hasMenuItems,
		headingClassName,
		headingLevel = 2,
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
		? __( 'All options are currently hidden' )
		: undefined;

	const canResetAll = [ ...defaultItems, ...optionalItems ].some(
		( [ , isSelected ] ) => isSelected
	);

	return (
		<HStack { ...headerProps } ref={ forwardedRef }>
			<Heading level={ headingLevel } className={ headingClassName }>
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
								itemClassName={ defaultControlsItemClassName }
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
			) }
		</HStack>
	);
};

const ConnectedToolsPanelHeader = contextConnect(
	ToolsPanelHeader,
	'ToolsPanelHeader'
);

export default ConnectedToolsPanelHeader;
