import type { ForwardedRef } from 'react';
import { speak } from '@wordpress/a11y';
import { check, moreVertical, plus, reset } from '@wordpress/icons';
import { __, _x, sprintf } from '@wordpress/i18n';
import DropdownMenu from '../../dropdown-menu';
import MenuGroup from '../../menu-group';
import MenuItem from '../../menu-item';
import { HStack } from '../../h-stack';
import { Heading } from '../../heading';
import { useToolsPanelHeader } from './hook';
import styles from '../style.module.scss';
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
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

	const resetSuffix = (
		<span aria-hidden className={ styles[ 'reset-label' ] }>
			{ __( 'Reset' ) }
		</span>
	);

	return (
		<>
			{ items.map( ( [ label, hasValue ] ) => {
				if ( hasValue ) {
					return (
						<MenuItem
							key={ label }
							className={ itemClassName }
							role="menuitem"
							label={ sprintf(
								// translators: %s: The control name, e.g. "Padding". Keep the control name first, followed by the reset action, to match the visible menu label order.
								__( '%s, reset to default' ),
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
						icon={ check }
						className={ itemClassName }
						role="menuitemcheckbox"
						isSelected
						aria-disabled
					>
						{ label }
					</MenuItem>
				);
			} ) }
		</>
	);
};

const OptionalControlsGroup = ( {
	items,
	toggleItem,
	isVisibilityOnly,
}: ToolsPanelControlsGroupProps ) => {
	if ( ! items.length ) {
		return null;
	}

	return (
		<>
			{ items.map( ( [ label, isSelected ] ) => {
				// Only the hide action resets here, since a value has to be
				// cleared for the item to stay hidden.
				const hideLabel = isVisibilityOnly
					? sprintf(
							// translators: %s: The control name, e.g. "Padding". Keep the control name first, followed by the remove action.
							__( '%s, remove' ),
							label
						)
					: sprintf(
							// translators: %s: The control name, e.g. "Padding". Keep the control name first, followed by the hide and reset action.
							__( '%s, hide and reset' ),
							label
						);
				const itemLabel = isSelected
					? hideLabel
					: sprintf(
							// translators: %s: The control name, e.g. "Padding". Keep the control name first, followed by the show action.
							_x( '%s, show', 'input control' ),
							label
						);

				return (
					<MenuItem
						key={ label }
						icon={ isSelected ? check : null }
						isSelected={ isSelected }
						label={ itemLabel }
						onClick={ () => {
							if ( isSelected ) {
								speak(
									isVisibilityOnly
										? sprintf(
												// translators: %s: The name of the control being removed e.g. "Padding".
												__( '%s removed' ),
												label
											)
										: sprintf(
												// translators: %s: The name of the control being reset e.g. "Padding".
												__(
													'%s hidden and reset to default'
												),
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
		</>
	);
};

const ResetMenu = ( {
	itemsWithValue,
	labelText,
	resetAll,
	resetItem,
	dropdownMenuProps,
	menuClassName,
}: {
	itemsWithValue: string[];
	labelText: string;
	resetAll: () => void;
	resetItem?: ( label: string ) => void;
	dropdownMenuProps: ToolsPanelHeaderProps[ 'dropdownMenuProps' ];
	menuClassName?: string;
} ) => (
	<DropdownMenu
		{ ...dropdownMenuProps }
		icon={ reset }
		label={ sprintf(
			// translators: %s: The name of the tool e.g. "Color" or "Typography".
			_x( 'Reset %s', 'Button label to reveal tool panel reset options' ),
			labelText
		) }
		menuProps={ { className: menuClassName } }
		toggleProps={ { size: 'small' } }
	>
		{ ( { onClose } ) => (
			<>
				<MenuGroup label={ __( 'Reset' ) }>
					{ itemsWithValue.map( ( label ) => (
						<MenuItem
							key={ label }
							onClick={ () => {
								resetItem?.( label );
								speak(
									sprintf(
										// translators: %s: The name of the control being reset e.g. "Padding".
										__( '%s reset' ),
										label
									),
									'assertive'
								);
								onClose();
							} }
						>
							{ label }
						</MenuItem>
					) ) }
				</MenuGroup>
				<MenuGroup>
					<MenuItem
						// @ts-expect-error - TODO: If this "tertiary" style is something we really want to allow on MenuItem,
						// we should rename it and explicitly allow it as an official API. All the other Button variants
						// don't make sense in a MenuItem context, and should be disallowed.
						variant="tertiary"
						onClick={ () => {
							resetAll();
							speak( __( 'All options reset' ), 'assertive' );
							onClose();
						} }
					>
						{ __( 'Reset all' ) }
					</MenuItem>
				</MenuGroup>
			</>
		) }
	</DropdownMenu>
);

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
		inheritanceMode,
		inheritedItems,
		itemsWithValue = [],
		menuActionsClassName,
		headingLevel = 2,
		label: labelText,
		menuItems,
		resetAll,
		resetItem,
		toggleItem,
		dropdownMenuProps,
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

	// An inherited item can't be added or removed, as it always shows while it
	// inherits a value, so it stays out of the menu.
	const toggleableItems = inheritanceMode
		? [ ...defaultItems, ...optionalItems ].filter(
				( [ label ] ) => ! inheritedItems?.[ label ]
			)
		: [];

	return (
		<HStack { ...headerProps } ref={ forwardedRef }>
			<Heading level={ headingLevel } className={ headingClassName }>
				{ labelText }
			</Heading>
			{ inheritanceMode &&
				( itemsWithValue.length > 0 || toggleableItems.length > 0 ) && (
					<HStack
						className={ menuActionsClassName }
						expanded={ false }
						spacing={ 1 }
					>
						{ itemsWithValue.length > 0 && (
							<ResetMenu
								itemsWithValue={ itemsWithValue }
								labelText={ labelText }
								resetAll={ resetAll }
								resetItem={ resetItem }
								dropdownMenuProps={ dropdownMenuProps }
								menuClassName={ dropdownMenuClassName }
							/>
						) }
						{ toggleableItems.length > 0 && (
							<DropdownMenu
								{ ...dropdownMenuProps }
								// Resets live in their own menu, so this one is
								// mostly for adding controls.
								icon={ plus }
								label={ sprintf(
									// translators: %s: The name of the tool e.g. "Color" or "Typography".
									_x(
										'%s controls',
										'Button label to reveal the menu that adds and removes tool panel controls'
									),
									labelText
								) }
								menuProps={ {
									className: dropdownMenuClassName,
								} }
								toggleProps={ { size: 'small' } }
							>
								{ () => (
									<MenuGroup
										label={ _x(
											'Controls',
											'Heading of the menu that adds and removes tool panel controls'
										) }
									>
										<OptionalControlsGroup
											items={ toggleableItems }
											toggleItem={ toggleItem }
											isVisibilityOnly
										/>
									</MenuGroup>
								) }
							</DropdownMenu>
						) }
					</HStack>
				) }
			{ ! inheritanceMode && hasMenuItems && (
				<DropdownMenu
					{ ...dropdownMenuProps }
					icon={ dropDownMenuIcon }
					label={ dropDownMenuLabelText }
					menuProps={ { className: dropdownMenuClassName } }
					toggleProps={ {
						size: 'small',
						description: dropdownMenuDescriptionText,
					} }
				>
					{ () => (
						<>
							<MenuGroup label={ labelText }>
								<DefaultControlsGroup
									items={ defaultItems }
									toggleItem={ toggleItem }
									itemClassName={
										defaultControlsItemClassName
									}
								/>
								<OptionalControlsGroup
									items={ optionalItems }
									toggleItem={ toggleItem }
								/>
							</MenuGroup>
							<MenuGroup>
								<MenuItem
									aria-disabled={ ! canResetAll }
									// @ts-expect-error - TODO: If this "tertiary" style is something we really want to allow on MenuItem,
									// we should rename it and explicitly allow it as an official API. All the other Button variants
									// don't make sense in a MenuItem context, and should be disallowed.
									variant="tertiary"
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
