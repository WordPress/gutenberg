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
	__experimentalZStack as ZStack,
	__experimentalVStack as VStack,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	Button,
	ColorIndicator,
	DuotonePicker,
	DuotoneSwatch,
	Dropdown,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getValueFromVariable } from './utils';
import { setImmutably } from '../../utils/object';

const EMPTY_ARRAY = [];
function useMultiOriginColorPresets(
	settings,
	{ presetSetting, defaultSetting }
) {
	const disableDefault = ! settings?.color?.[ defaultSetting ];
	const userPresets =
		settings?.color?.[ presetSetting ]?.custom || EMPTY_ARRAY;
	const themePresets =
		settings?.color?.[ presetSetting ]?.theme || EMPTY_ARRAY;
	const defaultPresets =
		settings?.color?.[ presetSetting ]?.default || EMPTY_ARRAY;
	return useMemo(
		() => [
			...userPresets,
			...themePresets,
			...( disableDefault ? EMPTY_ARRAY : defaultPresets ),
		],
		[ disableDefault, userPresets, themePresets, defaultPresets ]
	);
}

export function useHasFiltersPanel( settings ) {
	const hasDuotone = useHasDuotoneControl( settings );

	return hasDuotone;
}

function useHasDuotoneControl( settings ) {
	return settings.color.customDuotone || settings.color.defaultDuotone;
}

function FiltersToolsPanel( {
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
			label={ _x( 'Filters', 'Name for applying graphical effects' ) }
			resetAll={ resetAll }
			panelId={ panelId }
		>
			{ children }
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS = {
	duotone: true,
};

const popoverProps = {
	placement: 'left-start',
	offset: 36,
	shift: true,
	className: 'block-editor-duotone-control__popover',
	headerTitle: __( 'Duotone' ),
};

const LabeledColorIndicator = ( { indicator, label } ) => (
	<HStack justify="flex-start">
		<ZStack isLayered={ false } offset={ -8 }>
			<Flex expanded={ false }>
				{ indicator === 'unset' || ! indicator ? (
					<ColorIndicator className="block-editor-duotone-control__unset-indicator" />
				) : (
					<DuotoneSwatch values={ indicator } />
				) }
			</Flex>
		</ZStack>
		<FlexItem title={ label }>{ label }</FlexItem>
	</HStack>
);

export default function FiltersPanel( {
	as: Wrapper = FiltersToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
} ) {
	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );

	// Duotone
	const hasDuotoneEnabled = useHasDuotoneControl( settings );
	const duotonePalette = useMultiOriginColorPresets( settings, {
		presetSetting: 'duotone',
		defaultSetting: 'defaultDuotone',
	} );
	const colorPalette = useMultiOriginColorPresets( settings, {
		presetSetting: 'palette',
		defaultSetting: 'defaultPalette',
	} );
	const duotone = decodeValue( inheritedValue?.filter?.duotone );
	const setDuotone = ( newValue ) => {
		const duotonePreset = duotonePalette.find( ( { colors } ) => {
			return colors === newValue;
		} );
		const settedValue = duotonePreset
			? `var:preset|duotone|${ duotonePreset.slug }`
			: newValue;
		onChange( setImmutably( value, [ 'filter', 'duotone' ], settedValue ) );
	};
	const hasDuotone = () => !! value?.filter?.duotone;
	const resetDuotone = () => setDuotone( undefined );

	const disableCustomColors = ! settings?.color?.custom;
	const disableCustomDuotone =
		! settings?.color?.customDuotone ||
		( colorPalette?.length === 0 && disableCustomColors );

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			filter: {
				...previousValue.filter,
				duotone: undefined,
			},
		};
	}, [] );

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
		>
			{ hasDuotoneEnabled && (
				<ToolsPanelItem
					label={ __( 'Duotone' ) }
					hasValue={ hasDuotone }
					onDeselect={ resetDuotone }
					isShownByDefault={ defaultControls.duotone }
					panelId={ panelId }
				>
					<Dropdown
						popoverProps={ popoverProps }
						className="block-editor-global-styles-filters-panel__dropdown"
						renderToggle={ ( { onToggle, isOpen } ) => {
							const toggleProps = {
								onClick: onToggle,
								className: classnames( { 'is-open': isOpen } ),
								'aria-expanded': isOpen,
							};

							return (
								<ItemGroup isBordered isSeparated>
									<Button { ...toggleProps }>
										<LabeledColorIndicator
											indicator={ duotone }
											label={ __( 'Duotone' ) }
										/>
									</Button>
								</ItemGroup>
							);
						} }
						renderContent={ () => (
							<DropdownContentWrapper paddingSize="medium">
								<VStack>
									<p>
										{ __(
											'Create a two-tone color effect without losing your original image.'
										) }
									</p>
									<DuotonePicker
										colorPalette={ colorPalette }
										duotonePalette={ duotonePalette }
										disableCustomColors={
											disableCustomColors
										}
										disableCustomDuotone={
											disableCustomDuotone
										}
										value={ duotone }
										onChange={ setDuotone }
									/>
								</VStack>
							</DropdownContentWrapper>
						) }
					/>
				</ToolsPanelItem>
			) }
		</Wrapper>
	);
}
