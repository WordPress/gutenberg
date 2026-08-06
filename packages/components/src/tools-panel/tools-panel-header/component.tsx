/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { Fragment } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
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
import styles from '../style.module.scss';
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import type {
	ToolsPanelControlsGroupProps,
	ToolsPanelHeaderProps,
} from '../types';

// Renders a menu item's description, when the consumer supplies one, as an
// `aria-hidden` sibling referenced by the item's `aria-describedby`. Keeping it
// out of the menu's role structure avoids putting non-menuitem children inside
// `role="menu"`, while `aria-describedby` still surfaces it to assistive
// technology as that item's description.
const createDescriptionRenderer = (
	menuItemDescription: ToolsPanelControlsGroupProps[ 'menuItemDescription' ],
	descriptionIdPrefix: string | undefined
) =>
	function renderDescription( label: string ) {
		const description = menuItemDescription?.( label );
		if ( ! description || ! descriptionIdPrefix ) {
			return { descriptionId: undefined, descriptionNode: null };
		}
		const descriptionId = `${ descriptionIdPrefix }-${ label.replace(
			/\W+/g,
			'-'
		) }`;
		return {
			descriptionId,
			descriptionNode: (
				<div
					id={ descriptionId }
					aria-hidden="true"
					className={ styles[ 'menu-item-description' ] }
				>
					{ description }
				</div>
			),
		};
	};

const DefaultControlsGroup = ( {
	itemClassName,
	items,
	toggleItem,
	menuItemDescription,
	descriptionIdPrefix,
}: ToolsPanelControlsGroupProps ) => {
	if ( ! items.length ) {
		return null;
	}

	const renderDescription = createDescriptionRenderer(
		menuItemDescription,
		descriptionIdPrefix
	);

	const resetSuffix = (
		<span aria-hidden className={ styles[ 'reset-label' ] }>
			{ __( 'Reset' ) }
		</span>
	);

	return (
		<>
			{ items.map( ( [ label, hasValue ] ) => {
				const { descriptionId, descriptionNode } =
					renderDescription( label );
				if ( hasValue ) {
					return (
						<Fragment key={ label }>
							<MenuItem
								className={ clsx( itemClassName, {
									[ styles[ 'menu-item-described' ] ]:
										!! descriptionId,
								} ) }
								role="menuitem"
								aria-describedby={ descriptionId }
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
							{ descriptionNode }
						</Fragment>
					);
				}

				return (
					<Fragment key={ label }>
						<MenuItem
							icon={ check }
							className={ clsx( itemClassName, {
								[ styles[ 'menu-item-described' ] ]:
									!! descriptionId,
							} ) }
							role="menuitemcheckbox"
							aria-describedby={ descriptionId }
							isSelected
							aria-disabled
						>
							{ label }
						</MenuItem>
						{ descriptionNode }
					</Fragment>
				);
			} ) }
		</>
	);
};

const OptionalControlsGroup = ( {
	items,
	toggleItem,
	menuItemDescription,
	descriptionIdPrefix,
}: ToolsPanelControlsGroupProps ) => {
	if ( ! items.length ) {
		return null;
	}

	const renderDescription = createDescriptionRenderer(
		menuItemDescription,
		descriptionIdPrefix
	);

	return (
		<>
			{ items.map( ( [ label, isSelected ] ) => {
				const { descriptionId, descriptionNode } =
					renderDescription( label );
				const itemLabel = isSelected
					? sprintf(
							// translators: %s: The name of the control being hidden and reset e.g. "Padding".
							__( 'Hide and reset %s' ),
							label
					  )
					: sprintf(
							// translators: %s: The name of the control to display e.g. "Padding".
							_x( 'Show %s', 'input control' ),
							label
					  );

				return (
					<Fragment key={ label }>
						<MenuItem
							className={ clsx( {
								[ styles[ 'menu-item-described' ] ]:
									!! descriptionId,
							} ) }
							icon={ isSelected ? check : null }
							isSelected={ isSelected }
							aria-describedby={ descriptionId }
							label={ itemLabel }
							onClick={ () => {
								if ( isSelected ) {
									speak(
										sprintf(
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
						{ descriptionNode }
					</Fragment>
				);
			} ) }
		</>
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
		dropdownMenuProps,
		__experimentalMenuItemDescription,
		...headerProps
	} = useToolsPanelHeader( props );

	const instanceId = useInstanceId(
		ToolsPanelHeader,
		'tools-panel-item-description'
	);

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
									menuItemDescription={
										__experimentalMenuItemDescription
									}
									descriptionIdPrefix={ instanceId }
								/>
								<OptionalControlsGroup
									items={ optionalItems }
									toggleItem={ toggleItem }
									menuItemDescription={
										__experimentalMenuItemDescription
									}
									descriptionIdPrefix={ instanceId }
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
