/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/use-recommended-components
	__experimentalZStack as ZStack, // eslint-disable-line @wordpress/use-recommended-components
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	MenuGroup,
	ColorIndicator,
	DuotonePicker,
	DuotoneSwatch,
	Dropdown,
	Flex,
	FlexItem,
	Button,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { reset as resetIcon } from '@wordpress/icons';
import { getValueFromVariable } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';
import {
	getInheritanceProps,
	getInheritanceTooltipTextByPath,
	InheritanceToolsPanelItem,
} from './inheritance';
import { useStylePushHandlers } from './inherited-value-context';

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
	return useHasDuotoneControl( settings );
}

function useHasDuotoneControl( settings ) {
	return (
		settings.color.customDuotone ||
		settings.color.defaultDuotone ||
		settings.color.duotone.length > 0
	);
}

function FiltersToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
} ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ _x( 'Filters', 'Name for applying graphical effects' ) }
			resetAll={ resetAll }
			panelId={ panelId }
			dropdownMenuProps={ dropdownMenuProps }
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

const renderToggle = ( duotone, resetDuotone ) =>
	function Toggle( { onToggle, isOpen } ) {
		const duotoneButtonRef = useRef( undefined );

		const toggleProps = {
			onClick: onToggle,
			className: clsx(
				'block-editor-global-styles-filters-panel__dropdown-toggle',
				{ 'is-open': isOpen }
			),
			'aria-expanded': isOpen,
			ref: duotoneButtonRef,
		};

		const removeButtonProps = {
			onClick: () => {
				if ( isOpen ) {
					onToggle();
				}
				resetDuotone();
				// Return focus to parent button.
				duotoneButtonRef.current?.focus();
			},
			className: 'block-editor-panel-duotone-settings__reset',
			label: __( 'Reset' ),
		};

		return (
			<>
				<Button __next40pxDefaultSize { ...toggleProps }>
					<LabeledColorIndicator
						indicator={ duotone }
						label={ __( 'Duotone' ) }
					/>
				</Button>
				{ duotone && (
					<Button
						size="small"
						icon={ resetIcon }
						{ ...removeButtonProps }
					/>
				) }
			</>
		);
	};

export default function FiltersPanel( {
	as: Wrapper = FiltersToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	inheritedSources = {},
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
	showInheritanceLabelIndicators = true,
} ) {
	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );
	const inheritanceProps = ( isInherited, hasLocalOverride, className ) =>
		showInheritanceLabelIndicators
			? getInheritanceProps( isInherited, hasLocalOverride, className )
			: {};
	const tooltipText = ( path ) =>
		getInheritanceTooltipTextByPath( inheritedSources, path );
	const getPushHandler = useStylePushHandlers( value );

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
	const localDuotone = decodeValue( value?.filter?.duotone );
	const inheritedDuotone = decodeValue( inheritedValue?.filter?.duotone );
	const duotone = localDuotone ?? inheritedDuotone;
	const isDuotonePlaceholder =
		localDuotone === undefined && inheritedDuotone !== undefined;
	const setDuotone = ( newValue ) => {
		const duotonePreset = duotonePalette.find( ( { colors } ) => {
			return colors === newValue;
		} );
		const duotoneValue = duotonePreset
			? `var:preset|duotone|${ duotonePreset.slug }`
			: newValue;
		onChange(
			setImmutably( value, [ 'filter', 'duotone' ], duotoneValue )
		);
	};
	// Commit the inherited value when the user clicks the active preset
	// while the picker is showing inherited duotone at rest.
	const setDuotoneWithInheritedCommit = ( newValue ) => {
		if (
			newValue === undefined &&
			isDuotonePlaceholder &&
			inheritedDuotone !== undefined
		) {
			setDuotone( inheritedDuotone );
			return;
		}
		setDuotone( newValue );
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
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isDuotonePlaceholder,
						localDuotone !== undefined &&
							inheritedDuotone !== undefined
					) }
					label={ __( 'Duotone' ) }
					inheritanceTooltipText={ tooltipText( 'filter.duotone' ) }
					hasValue={ hasDuotone }
					onDeselect={ resetDuotone }
					onPushToGlobalStyles={ getPushHandler(
						[ [ 'filter', 'duotone' ] ],
						resetDuotone
					) }
					isShownByDefault={ defaultControls.duotone }
					panelId={ panelId }
				>
					<Dropdown
						popoverProps={ popoverProps }
						className="block-editor-global-styles-filters-panel__dropdown"
						renderToggle={ renderToggle( duotone, resetDuotone ) }
						renderContent={ () => (
							<DropdownContentWrapper paddingSize="small">
								<MenuGroup label={ __( 'Duotone' ) }>
									<p>
										{ __(
											'Create a two-tone color effect without losing your original image.'
										) }
									</p>
									<DuotonePicker
										colorPalette={ colorPalette }
										duotonePalette={ duotonePalette }
										// TODO: Re-enable both when custom colors are supported for block-level styles.
										disableCustomColors
										disableCustomDuotone
										value={ duotone }
										onChange={
											setDuotoneWithInheritedCommit
										}
									/>
								</MenuGroup>
							</DropdownContentWrapper>
						) }
					/>
				</InheritanceToolsPanelItem>
			) }
		</Wrapper>
	);
}
