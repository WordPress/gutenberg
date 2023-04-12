/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalGrid as Grid,
	__experimentalHeading as Heading,
	FlexItem,
	Dropdown,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
import { shadow as shadowIcon, Icon, check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getValueFromVariable } from './utils';
import { immutableSet } from '../../utils/object';

export function useHasEffectsPanel( settings ) {
	const hasShadowControl = useHasShadowControl( settings );
	return hasShadowControl;
}

function useHasShadowControl( settings ) {
	return !! settings?.shadow;
}

function EffectsToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
} ) {
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ __( 'Effects' ) }
			resetAll={ resetAll }
			panelId={ panelId }
		>
			{ children }
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS = {
	shadow: true,
};

export default function EffectsPanel( {
	as: Wrapper = EffectsToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
} ) {
	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );

	// Shadow
	const hasShadowEnabled = useHasShadowControl( settings );
	const shadow = decodeValue( inheritedValue?.shadow );
	const setShadow = ( newValue ) => {
		onChange( immutableSet( value, [ 'shadow' ], newValue ) );
	};
	const hasShadow = () => !! value?.shadow;
	const resetShadow = () => setShadow( undefined );

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			shadow: undefined,
		};
	}, [] );

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
		>
			{ hasShadowEnabled && (
				<ToolsPanelItem
					label={ __( 'Shadow' ) }
					hasValue={ hasShadow }
					onDeselect={ resetShadow }
					isShownByDefault={ defaultControls.shadow }
					panelId={ panelId }
				>
					<ItemGroup isBordered isSeparated>
						<ShadowPopover
							shadow={ shadow }
							onShadowChange={ setShadow }
							settings={ settings }
						/>
					</ItemGroup>
				</ToolsPanelItem>
			) }
		</Wrapper>
	);
}

const ShadowPopover = ( { shadow, onShadowChange, settings } ) => {
	const popoverProps = {
		placement: 'left-start',
		offset: 36,
		shift: true,
	};

	return (
		<Dropdown
			popoverProps={ popoverProps }
			className="block-editor-global-styles-effects-panel__shadow-dropdown"
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
};

function renderShadowToggle() {
	return ( { onToggle, isOpen } ) => {
		const toggleProps = {
			onClick: onToggle,
			className: classnames( { 'is-open': isOpen } ),
			'aria-expanded': isOpen,
		};

		return (
			<Button { ...toggleProps }>
				<HStack justify="flex-start">
					<Icon
						className="block-editor-global-styles-effects-panel__toggle-icon"
						icon={ shadowIcon }
						size={ 24 }
					/>
					<FlexItem>{ __( 'Shadow' ) }</FlexItem>
				</HStack>
			</Button>
		);
	};
}

function ShadowPopoverContainer( { shadow, onShadowChange, settings } ) {
	const defaultShadows = settings?.shadow?.presets?.default;
	const themeShadows = settings?.shadow?.presets?.theme;
	const defaultPresetsEnabled = settings?.shadow?.defaultPresets;

	const shadows = [
		...( defaultPresetsEnabled ? defaultShadows : [] ),
		...( themeShadows || [] ),
	];

	return (
		<div className="block-editor-global-styles-effects-panel__shadow-popover-container">
			<VStack spacing={ 4 }>
				<Heading level={ 5 }>{ __( 'Shadow' ) }</Heading>
				<ShadowPresets
					presets={ shadows }
					activeShadow={ shadow }
					onSelect={ onShadowChange }
				/>
			</VStack>
		</div>
	);
}

function ShadowPresets( { presets, activeShadow, onSelect } ) {
	return ! presets ? null : (
		<Grid columns={ 6 } gap={ 0 } align="center" justify="center">
			{ presets.map( ( { name, slug, shadow } ) => (
				<ShadowIndicator
					key={ slug }
					label={ name }
					isActive={ shadow === activeShadow }
					onSelect={ () =>
						onSelect( shadow === activeShadow ? undefined : shadow )
					}
					shadow={ shadow }
				/>
			) ) }
		</Grid>
	);
}

function ShadowIndicator( { label, isActive, onSelect, shadow } ) {
	return (
		<div className="block-editor-global-styles-effects-panel__shadow-indicator-wrapper">
			<Button
				className="block-editor-global-styles-effects-panel__shadow-indicator"
				onClick={ onSelect }
				label={ label }
				style={ { boxShadow: shadow } }
				showTooltip
			>
				{ isActive && <Icon icon={ check } /> }
			</Button>
		</div>
	);
}
