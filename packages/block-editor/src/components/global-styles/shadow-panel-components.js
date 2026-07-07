/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	Button,
	FlexItem,
	Dropdown,
	Composite,
} from '@wordpress/components';
import { useMemo, useRef } from '@wordpress/element';
import { shadow as shadowIcon, Icon, check, reset } from '@wordpress/icons';

/**
 * External dependencies
 */
import clsx from 'clsx';

import { Tooltip } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { InheritanceResetButton } from './inheritance';

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation.
 *
 * @type {Array}
 */
const EMPTY_ARRAY = [];

export function ShadowPopoverContainer( { shadow, onShadowChange, settings } ) {
	const shadows = useShadowPresets( settings );

	return (
		<div className="block-editor-global-styles__shadow-popover-container">
			<VStack spacing={ 4 }>
				<Heading level={ 5 }>{ __( 'Drop shadow' ) }</Heading>
				<ShadowPresets
					presets={ shadows }
					activeShadow={ shadow }
					onSelect={ onShadowChange }
				/>
				<div className="block-editor-global-styles__clear-shadow">
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ () => onShadowChange( undefined ) }
						disabled={ ! shadow }
						accessibleWhenDisabled
					>
						{ __( 'Clear' ) }
					</Button>
				</div>
			</VStack>
		</div>
	);
}

export function ShadowPresets( { presets, activeShadow, onSelect } ) {
	return ! presets ? null : (
		<Composite
			role="listbox"
			className="block-editor-global-styles__shadow__list"
			aria-label={ __( 'Drop shadows' ) }
		>
			{ presets.map( ( { name, slug, shadow } ) => (
				<ShadowIndicator
					key={ slug }
					label={ name }
					isActive={ shadow === activeShadow }
					type={ slug === 'unset' ? 'unset' : 'preset' }
					onSelect={ () =>
						onSelect( shadow === activeShadow ? undefined : shadow )
					}
					shadow={ shadow }
				/>
			) ) }
		</Composite>
	);
}

export function ShadowIndicator( { type, label, isActive, onSelect, shadow } ) {
	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<Composite.Item
						role="option"
						aria-label={ label }
						aria-selected={ isActive }
						className={ clsx(
							'block-editor-global-styles__shadow__item',
							{
								'is-active': isActive,
							}
						) }
						render={
							<button
								className={ clsx(
									'block-editor-global-styles__shadow-indicator',
									{
										unset: type === 'unset',
									}
								) }
								onClick={ onSelect }
								style={ { boxShadow: shadow } }
								aria-label={ label }
							>
								{ isActive && <Icon icon={ check } /> }
							</button>
						}
					/>
				}
			/>
			<Tooltip.Popup>{ label }</Tooltip.Popup>
		</Tooltip.Root>
	);
}

export function ShadowPopover( {
	shadow,
	onShadowChange,
	settings,
	className,
	hasLocalValue = !! shadow,
	hasLocalOverride = false,
	onReset,
} ) {
	const popoverProps = {
		placement: 'left-start',
		offset: 36,
		shift: true,
	};

	return (
		<Dropdown
			popoverProps={ popoverProps }
			className={ clsx(
				'block-editor-global-styles__shadow-dropdown',
				className
			) }
			renderToggle={ renderShadowToggle( shadow, onShadowChange, {
				hasLocalValue,
				hasLocalOverride,
				onReset: onReset ?? ( () => onShadowChange( undefined ) ),
			} ) }
			renderContent={ () => (
				<DropdownContentWrapper paddingSize="medium">
					<ShadowPopoverContainer
						shadow={ shadow }
						onShadowChange={ onShadowChange }
						settings={ settings }
					/>
				</DropdownContentWrapper>
			) }
		/>
	);
}

function renderShadowToggle( shadow, onShadowChange, resetConfig ) {
	const { hasLocalValue, hasLocalOverride, onReset } = resetConfig;
	return function ShadowToggle( { onToggle, isOpen } ) {
		const shadowButtonRef = useRef( undefined );

		const toggleProps = {
			onClick: onToggle,
			className: clsx(
				'block-editor-global-styles__shadow-dropdown-toggle',
				{ 'is-open': isOpen }
			),
			'aria-expanded': isOpen,
			ref: shadowButtonRef,
		};

		const handleReset = () => {
			if ( isOpen ) {
				onToggle();
			}
			onReset();
			// Return focus to parent button.
			shadowButtonRef.current?.focus();
		};

		return (
			<>
				<Button __next40pxDefaultSize { ...toggleProps }>
					<HStack justify="flex-start">
						<Icon
							className="block-editor-global-styles__toggle-icon"
							icon={ shadowIcon }
							size={ 24 }
						/>
						<FlexItem>{ __( 'Drop shadow' ) }</FlexItem>
					</HStack>
				</Button>
				{ hasLocalValue &&
					( hasLocalOverride ? (
						<InheritanceResetButton
							className="block-editor-global-styles__shadow-editor__remove-button"
							onResetToInherited={ handleReset }
						/>
					) : (
						<Button
							__next40pxDefaultSize
							size="small"
							icon={ reset }
							label={ __( 'Remove' ) }
							className="block-editor-global-styles__shadow-editor__remove-button"
							onClick={ handleReset }
						/>
					) ) }
			</>
		);
	};
}

export function useShadowPresets( settings ) {
	return useMemo( () => {
		if ( ! settings?.shadow ) {
			return EMPTY_ARRAY;
		}

		const defaultPresetsEnabled = settings?.shadow?.defaultPresets;
		const {
			default: defaultShadows,
			theme: themeShadows,
			custom: customShadows,
		} = settings?.shadow?.presets ?? {};
		const unsetShadow = {
			name: __( 'Unset' ),
			slug: 'unset',
			shadow: 'none',
		};

		const shadowPresets = [
			...( ( defaultPresetsEnabled && defaultShadows ) || EMPTY_ARRAY ),
			...( themeShadows || EMPTY_ARRAY ),
			...( customShadows || EMPTY_ARRAY ),
		];
		if ( shadowPresets.length ) {
			shadowPresets.unshift( unsetShadow );
		}

		return shadowPresets;
	}, [ settings ] );
}
