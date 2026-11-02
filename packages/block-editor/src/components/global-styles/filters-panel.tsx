import clsx from 'clsx';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	MenuGroup,
	ColorIndicator,
	DuotonePicker,
	DuotoneSwatch,
	Dropdown,
	Button,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __, _x } from '@wordpress/i18n';
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { reset as resetIcon } from '@wordpress/icons';
import { getValueFromVariable } from '@wordpress/global-styles-engine';
import type { ComponentProps } from 'react';
import type { Color, Duotone } from '@wordpress/global-styles-engine';
import {
	useToolsPanelDropdownMenuProps,
	useToolsPanelItemPopoverProps,
	getDuotoneSlugFromPreset,
} from './utils';
import { setImmutably } from '../../utils/object';
import type {
	FiltersPanelProps,
	PanelResetAllFilter,
	StyleSettings,
	StyleToolsPanelProps,
	StyleValue,
} from './types';

const EMPTY_ARRAY: never[] = [];
function useMultiOriginColorPresets< K extends 'duotone' | 'palette' >(
	settings: StyleSettings | undefined,
	{
		presetSetting,
		defaultSetting,
	}: {
		presetSetting: K;
		defaultSetting: 'defaultDuotone' | 'defaultPalette';
	}
) {
	const disableDefault = ! settings?.color?.[ defaultSetting ];
	const userPresets =
		settings?.color?.[ presetSetting ]?.custom || EMPTY_ARRAY;
	const themePresets =
		settings?.color?.[ presetSetting ]?.theme || EMPTY_ARRAY;
	const defaultPresets =
		settings?.color?.[ presetSetting ]?.default || EMPTY_ARRAY;
	return useMemo(
		() =>
			// The presets of a setting are all of its kind.
			[
				...userPresets,
				...themePresets,
				...( disableDefault ? EMPTY_ARRAY : defaultPresets ),
			] as ( K extends 'duotone' ? Duotone : Color )[],
		[ disableDefault, userPresets, themePresets, defaultPresets ]
	);
}

export function useHasFiltersPanel( settings: StyleSettings ) {
	return useHasDuotoneControl( settings );
}

function useHasDuotoneControl( settings: StyleSettings ) {
	// The filters panel gets resolved color settings. An object of presets
	// has no length, so it reads as none.
	return (
		settings.color!.customDuotone ||
		settings.color!.defaultDuotone ||
		( settings.color!.duotone as unknown[] ).length > 0
	);
}

function FiltersToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
}: StyleToolsPanelProps ) {
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

const DEFAULT_CONTROLS: Record< string, boolean > = {
	duotone: true,
};

const LabeledColorIndicator = ( {
	indicator,
	label,
}: {
	indicator?: string[] | 'unset';
	label: string;
} ) => (
	<Stack
		className="block-editor-panel-duotone-settings__label-row"
		direction="row"
		align="center"
		justify="flex-start"
		gap="sm"
	>
		{ indicator === 'unset' || ! indicator ? (
			<ColorIndicator className="block-editor-duotone-control__unset-indicator" />
		) : (
			<DuotoneSwatch values={ indicator } />
		) }
		<span
			className="block-editor-panel-duotone-settings__label"
			title={ label }
		>
			{ label }
		</span>
	</Stack>
);

const renderToggle = (
	duotone: string[] | 'unset' | undefined,
	resetConfig: {
		hasLocalValue: boolean;
		onReset: () => void;
	}
) =>
	function Toggle( {
		onToggle,
		isOpen,
	}: Parameters<
		ComponentProps< typeof Dropdown >[ 'renderToggle' ]
	>[ 0 ] ) {
		const { hasLocalValue, onReset } = resetConfig;
		const duotoneButtonRef = useRef< HTMLButtonElement >( undefined );

		const toggleProps = {
			onClick: onToggle,
			className: clsx(
				'block-editor-global-styles-filters-panel__dropdown-toggle',
				{ 'is-open': isOpen }
			),
			'aria-expanded': isOpen,
			ref: duotoneButtonRef,
		};

		const handleReset = () => {
			if ( isOpen ) {
				onToggle();
			}
			onReset();
			// Return focus to parent button.
			duotoneButtonRef.current?.focus();
		};

		return (
			<>
				<Button __next40pxDefaultSize { ...toggleProps }>
					<LabeledColorIndicator
						indicator={ duotone }
						label={ __( 'Duotone' ) }
					/>
				</Button>
				{ hasLocalValue && (
					<Button
						size="small"
						icon={ resetIcon }
						label={ __( 'Reset' ) }
						className="block-editor-panel-duotone-settings__reset"
						onClick={ handleReset }
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
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
}: FiltersPanelProps ) {
	const popoverProps = {
		...useToolsPanelItemPopoverProps(),
		className: 'block-editor-duotone-control__popover',
		headerTitle: __( 'Duotone' ),
	};
	const decodeValue = ( rawValue: StyleValue | string[] ) =>
		// A color array is returned as is.
		getValueFromVariable( { settings }, '', rawValue as StyleValue );

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
	// Read from the raw value, since decoding resolves a preset reference to
	// its colors and two presets can hold the same pair.
	// Duotone styles are preset references or colors.
	const localDuotoneSlug = getDuotoneSlugFromPreset(
		value?.filter?.duotone as string | string[] | undefined
	);
	const inheritedDuotoneSlug = getDuotoneSlugFromPreset(
		inheritedValue?.filter?.duotone as string | string[] | undefined
	);
	const duotoneSlug =
		localDuotone !== undefined ? localDuotoneSlug : inheritedDuotoneSlug;
	const isDuotonePlaceholder =
		localDuotone === undefined && inheritedDuotone !== undefined;
	const setDuotone = ( newValue?: string[] | 'unset', slug?: string ) => {
		// A slug identifies the picked preset exactly. Falling back to a value
		// match cannot tell two presets holding the same colors apart.
		const presetSlug =
			slug ??
			duotonePalette.find( ( { colors } ) => colors === newValue )?.slug;
		const duotoneValue = presetSlug
			? `var:preset|duotone|${ presetSlug }`
			: newValue;
		onChange(
			setImmutably( value, [ 'filter', 'duotone' ], duotoneValue )
		);
	};
	// Commit the inherited value when the user clicks the active preset
	// while the picker is showing inherited duotone at rest.
	const setDuotoneWithInheritedCommit = (
		newValue?: string[] | 'unset',
		index?: number,
		slug?: string
	) => {
		if (
			newValue === undefined &&
			isDuotonePlaceholder &&
			inheritedDuotone !== undefined
		) {
			setDuotone( inheritedDuotone, inheritedDuotoneSlug );
			return;
		}
		setDuotone( newValue, slug );
	};
	const hasDuotone = () => !! value?.filter?.duotone;
	const resetDuotone = () => setDuotone( undefined );

	const resetAllFilter: PanelResetAllFilter = useCallback(
		( previousValue ) => {
			return {
				...previousValue,
				filter: {
					// Reset all passes the current styles.
					...previousValue!.filter,
					duotone: undefined,
				},
			};
		},
		[]
	);

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
						renderToggle={ renderToggle( duotone, {
							hasLocalValue: hasDuotone(),
							onReset: resetDuotone,
						} ) }
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
										selectedSlug={ duotoneSlug }
										onChange={
											setDuotoneWithInheritedCommit
										}
									/>
								</MenuGroup>
							</DropdownContentWrapper>
						) }
					/>
				</ToolsPanelItem>
			) }
		</Wrapper>
	);
}
