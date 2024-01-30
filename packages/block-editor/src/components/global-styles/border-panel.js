/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalBorderBoxControl as BorderBoxControl,
	__experimentalHasSplitBorders as hasSplitBorders,
	__experimentalIsDefinedBorder as isDefinedBorder,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalGrid as Grid,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	Dropdown,
	Button,
	FlexItem,
} from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { shadow as shadowIcon, Icon, check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BorderRadiusControl from '../border-radius-control';
import { useColorsPerOrigin } from './hooks';
import { getValueFromVariable, TOOLSPANEL_DROPDOWNMENU_PROPS } from './utils';
import { mergeOrigins } from '../../store/get-block-settings';
import { setImmutably } from '../../utils/object';
import { getBorderPanelLabel } from '../../hooks/border';

function useHasShadowControl( settings ) {
	return !! settings?.shadow;
}

export function useHasBorderPanel( settings ) {
	const controls = [
		useHasBorderColorControl( settings ),
		useHasBorderRadiusControl( settings ),
		useHasBorderStyleControl( settings ),
		useHasBorderWidthControl( settings ),
	];

	return controls.some( Boolean );
}

function useHasBorderColorControl( settings ) {
	return settings?.border?.color;
}

function useHasBorderRadiusControl( settings ) {
	return settings?.border?.radius;
}

function useHasBorderStyleControl( settings ) {
	return settings?.border?.style;
}

function useHasBorderWidthControl( settings ) {
	return settings?.border?.width;
}

function BorderToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
	label,
} ) {
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ label }
			resetAll={ resetAll }
			panelId={ panelId }
			dropdownMenuProps={ TOOLSPANEL_DROPDOWNMENU_PROPS }
		>
			{ children }
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS = {
	radius: true,
	color: true,
	width: true,
	shadow: true,
};

export default function BorderPanel( {
	as: Wrapper = BorderToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	name,
	defaultControls = DEFAULT_CONTROLS,
} ) {
	const colors = useColorsPerOrigin( settings );
	const decodeValue = useCallback(
		( rawValue ) => getValueFromVariable( { settings }, '', rawValue ),
		[ settings ]
	);
	const encodeColorValue = ( colorValue ) => {
		const allColors = colors.flatMap(
			( { colors: originColors } ) => originColors
		);
		const colorObject = allColors.find(
			( { color } ) => color === colorValue
		);
		return colorObject
			? 'var:preset|color|' + colorObject.slug
			: colorValue;
	};
	const border = useMemo( () => {
		if ( hasSplitBorders( inheritedValue?.border ) ) {
			const borderValue = { ...inheritedValue?.border };
			[ 'top', 'right', 'bottom', 'left' ].forEach( ( side ) => {
				borderValue[ side ] = {
					...borderValue[ side ],
					color: decodeValue( borderValue[ side ]?.color ),
				};
			} );
			return borderValue;
		}
		return {
			...inheritedValue?.border,
			color: inheritedValue?.border?.color
				? decodeValue( inheritedValue?.border?.color )
				: undefined,
		};
	}, [ inheritedValue?.border, decodeValue ] );
	const setBorder = ( newBorder ) =>
		onChange( { ...value, border: newBorder } );
	const showBorderColor = useHasBorderColorControl( settings );
	const showBorderStyle = useHasBorderStyleControl( settings );
	const showBorderWidth = useHasBorderWidthControl( settings );

	// Border radius.
	const showBorderRadius = useHasBorderRadiusControl( settings );
	const borderRadiusValues = decodeValue( border?.radius );
	const setBorderRadius = ( newBorderRadius ) =>
		setBorder( { ...border, radius: newBorderRadius } );
	const hasBorderRadius = () => {
		const borderValues = value?.border?.radius;
		if ( typeof borderValues === 'object' ) {
			return Object.entries( borderValues ).some( Boolean );
		}
		return !! borderValues;
	};
	const hasShadowControl = useHasShadowControl( settings );

	// Shadow
	const shadow = decodeValue( inheritedValue?.shadow );
	const shadowPresets = settings?.shadow?.presets;
	const mergedShadowPresets = shadowPresets
		? mergeOrigins( shadowPresets )
		: [];
	const setShadow = ( newValue ) => {
		const slug = mergedShadowPresets?.find(
			( { shadow: shadowName } ) => shadowName === newValue
		)?.slug;

		onChange(
			setImmutably(
				value,
				[ 'shadow' ],
				slug ? `var:preset|shadow|${ slug }` : newValue || undefined
			)
		);
	};
	const hasShadow = () => !! value?.shadow;
	const resetShadow = () => setShadow( undefined );

	const resetBorder = () => {
		if ( hasBorderRadius() ) {
			return setBorder( { radius: value?.border?.radius } );
		}

		setBorder( undefined );
	};

	const onBorderChange = ( newBorder ) => {
		// Ensure we have a visible border style when a border width or
		// color is being selected.
		const updatedBorder = { ...newBorder };

		if ( hasSplitBorders( updatedBorder ) ) {
			[ 'top', 'right', 'bottom', 'left' ].forEach( ( side ) => {
				if ( updatedBorder[ side ] ) {
					updatedBorder[ side ] = {
						...updatedBorder[ side ],
						color: encodeColorValue( updatedBorder[ side ]?.color ),
					};
				}
			} );
		} else if ( updatedBorder ) {
			updatedBorder.color = encodeColorValue( updatedBorder.color );
		}

		// As radius is maintained separately to color, style, and width
		// maintain its value. Undefined values here will be cleaned when
		// global styles are saved.
		setBorder( { radius: border?.radius, ...updatedBorder } );
	};

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			border: undefined,
			shadow: undefined,
		};
	}, [] );

	const showBorderByDefault =
		defaultControls?.color || defaultControls?.width;

	const label = getBorderPanelLabel( name );

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
			label={ label }
		>
			{ ( showBorderWidth || showBorderColor ) && (
				<ToolsPanelItem
					hasValue={ () => isDefinedBorder( value?.border ) }
					label={ __( 'Border' ) }
					onDeselect={ () => resetBorder() }
					isShownByDefault={ showBorderByDefault }
					panelId={ panelId }
				>
					<BorderBoxControl
						colors={ colors }
						enableAlpha={ true }
						enableStyle={ showBorderStyle }
						onChange={ onBorderChange }
						popoverOffset={ 40 }
						popoverPlacement="left-start"
						value={ border }
						__experimentalIsRenderedInSidebar={ true }
						size={ '__unstable-large' }
					/>
				</ToolsPanelItem>
			) }
			{ showBorderRadius && (
				<ToolsPanelItem
					hasValue={ hasBorderRadius }
					label={ __( 'Radius' ) }
					onDeselect={ () => setBorderRadius( undefined ) }
					isShownByDefault={ defaultControls.radius }
					panelId={ panelId }
				>
					<BorderRadiusControl
						values={ borderRadiusValues }
						onChange={ ( newValue ) => {
							setBorderRadius( newValue || undefined );
						} }
					/>
				</ToolsPanelItem>
			) }
			{ hasShadowControl && (
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
