/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalVStack as VStack,
	DuotonePicker,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getValueFromVariable } from './utils';
import { immutableSet } from '../../utils/object';

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
			label={ __( 'Filters' ) }
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
		onChange( immutableSet( value, [ 'filter', 'duotone' ], settedValue ) );
	};
	const hasDuotone = () => !! value?.filter?.duotone;
	const resetDuotone = () => setDuotone( undefined );

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
					<VStack>
						<p>
							{ __(
								'Create a two-tone color effect without losing your original image.'
							) }
						</p>
						<DuotonePicker
							colorPalette={ colorPalette }
							duotonePalette={ duotonePalette }
							disableCustomColors={ true }
							disableCustomDuotone={ true }
							value={ duotone }
							onChange={ setDuotone }
						/>
					</VStack>
				</ToolsPanelItem>
			) }
		</Wrapper>
	);
}
