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
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { shadow as shadowIcon, Icon, check } from '@wordpress/icons';

/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation.
 *
 * @type {Array}
 */
const EMPTY_ARRAY = [];
const { CompositeItemV2: CompositeItem, CompositeV2: Composite } = unlock(
	componentsPrivateApis
);

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
						// TODO: Switch to `true` (40px size) if possible
						__next40pxDefaultSize={ false }
						variant="tertiary"
						onClick={ () => onShadowChange( undefined ) }
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
		<CompositeItem
			role="option"
			aria-label={ label }
			aria-selected={ isActive }
			className={ clsx( 'block-editor-global-styles__shadow__item', {
				'is-active': isActive,
			} ) }
			render={
				<Button
					// TODO: Switch to `true` (40px size) if possible
					__next40pxDefaultSize={ false }
					className={ clsx(
						'block-editor-global-styles__shadow-indicator',
						{
							unset: type === 'unset',
						}
					) }
					onClick={ onSelect }
					label={ label }
					style={ { boxShadow: shadow } }
					showTooltip
				>
					{ isActive && <Icon icon={ check } /> }
				</Button>
			}
		/>
	);
}

export function ShadowPopover( { shadow, onShadowChange, settings } ) {
	const popoverProps = {
		placement: 'left-start',
		offset: 36,
		shift: true,
	};

	return (
		<Dropdown
			popoverProps={ popoverProps }
			className="block-editor-global-styles__shadow-dropdown"
			renderToggle={ renderShadowToggle() }
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

function renderShadowToggle() {
	return ( { onToggle, isOpen } ) => {
		const toggleProps = {
			onClick: onToggle,
			className: clsx( { 'is-open': isOpen } ),
			'aria-expanded': isOpen,
		};

		return (
			<Button
				// TODO: Switch to `true` (40px size) if possible
				__next40pxDefaultSize={ false }
				{ ...toggleProps }
			>
				<HStack justify="flex-start">
					<Icon
						className="block-editor-global-styles__toggle-icon"
						icon={ shadowIcon }
						size={ 24 }
					/>
					<FlexItem>{ __( 'Drop shadow' ) }</FlexItem>
				</HStack>
			</Button>
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
