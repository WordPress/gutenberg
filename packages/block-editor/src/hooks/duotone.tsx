import { extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import {
	getBlockSupport,
	getBlockType,
	hasBlockSupport,
} from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { useMemo, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	getBlockSelector,
	privateApis as globalStylesEnginePrivateApis,
} from '@wordpress/global-styles-engine';
import {
	BlockControls,
	InspectorControls,
	__experimentalDuotoneControl as DuotoneControl,
	useSettings,
} from '../components';
import {
	scopeSelector,
	getDuotoneSlugFromPreset,
} from '../components/global-styles/utils';
import {
	cleanEmptyObject,
	useBlockSettings,
	usePrivateStyleOverride,
} from './utils';
import { unlock } from '../lock-unlock';
import { default as StylesFiltersPanel } from '../components/global-styles/filters-panel';
import { useResolvedStyle } from '../components/global-styles/inherited-value-context';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';
import { store as blockEditorStore } from '../store';
import type {
	BlockListBlockFeatureProps,
	ColorPreset,
	DuotonePanelProps,
	DuotonePreset,
	DuotoneStylesOptions,
	DuotoneValue,
} from './types';
import type { PanelStyle } from '../components/global-styles/types';

const { getDuotoneFilter, getDuotoneStylesheet, getDuotoneUnsetStylesheet } =
	unlock( globalStylesEnginePrivateApis );

const EMPTY_ARRAY: never[] = [];

// Safari does not always update the duotone filter when the duotone colors
// are changed. This browser check is later used to force a re-render of the block
// element to ensure the duotone filter is updated. The check is included at the
// root of this file as it only needs to be run once per page load.
const isSafari =
	window?.navigator.userAgent &&
	window.navigator.userAgent.includes( 'Safari' ) &&
	! window.navigator.userAgent.includes( 'Chrome' ) &&
	! window.navigator.userAgent.includes( 'Chromium' );

extend( [ namesPlugin ] );

function useMultiOriginPresets< T >( {
	presetSetting,
	defaultSetting,
}: {
	presetSetting: string;
	defaultSetting: string;
} ): T[] {
	// The settings hold the flag and the preset lists of each origin.
	const [ enableDefault, userPresets, themePresets, defaultPresets ] =
		useSettings(
			defaultSetting,
			`${ presetSetting }.custom`,
			`${ presetSetting }.theme`,
			`${ presetSetting }.default`
		) as [ boolean, T[] | undefined, T[] | undefined, T[] | undefined ];
	return useMemo(
		() => [
			...( userPresets || EMPTY_ARRAY ),
			...( themePresets || EMPTY_ARRAY ),
			...( ( enableDefault && defaultPresets ) || EMPTY_ARRAY ),
		],
		[ enableDefault, userPresets, themePresets, defaultPresets ]
	);
}

export function getColorsFromDuotonePreset(
	duotone?: DuotoneValue,
	duotonePalette?: DuotonePreset[]
): string[] | undefined {
	if ( ! duotone ) {
		return;
	}
	const preset = duotonePalette?.find( ( { slug } ) => {
		return duotone === `var:preset|duotone|${ slug }`;
	} );

	return preset ? preset.colors : undefined;
}

export function getDuotonePresetFromColors(
	colors?: DuotoneValue,
	duotonePalette?: DuotonePreset[]
): string | undefined {
	if ( ! colors || ! Array.isArray( colors ) ) {
		return;
	}

	const preset = duotonePalette?.find( ( duotonePreset ) => {
		return duotonePreset?.colors?.every(
			( val, index ) => val === colors[ index ]
		);
	} );

	return preset ? `var:preset|duotone|${ preset.slug }` : undefined;
}

function DuotonePanelPure( {
	style,
	setAttributes,
	name,
	clientId,
}: DuotonePanelProps ) {
	// The duotone style holds a preset reference, colors or a CSS value.
	const duotoneStyle = style?.color?.duotone as DuotoneValue | undefined;
	const settings = useBlockSettings( name );
	const blockEditingMode = useBlockEditingMode();

	const className = useSelect(
		( select ) =>
			clientId
				? // The class name attribute is a string.
					( select( blockEditorStore ).getBlockAttributes( clientId )
						?.className as string | undefined )
				: undefined,
		[ clientId ]
	);
	const { value: inheritedValue } = useResolvedStyle( name, className );

	const duotonePalette = useMultiOriginPresets< DuotonePreset >( {
		presetSetting: 'color.duotone',
		defaultSetting: 'color.defaultDuotone',
	} );
	const colorPalette = useMultiOriginPresets< ColorPreset >( {
		presetSetting: 'color.palette',
		defaultSetting: 'color.defaultPalette',
	} );
	const [ enableCustomColors, enableCustomDuotone ] = useSettings(
		'color.custom',
		'color.customDuotone'
	);
	const disableCustomColors = ! enableCustomColors;
	const disableCustomDuotone =
		! enableCustomDuotone ||
		( colorPalette?.length === 0 && disableCustomColors );

	if ( duotonePalette?.length === 0 && disableCustomDuotone ) {
		return null;
	}

	if ( blockEditingMode !== 'default' ) {
		return null;
	}

	const duotonePresetOrColors =
		duotoneStyle === 'unset' || Array.isArray( duotoneStyle )
			? duotoneStyle
			: getColorsFromDuotonePreset( duotoneStyle, duotonePalette );

	return (
		<>
			<InspectorControls group="filter">
				<StylesFiltersPanel
					// The raw value, not the resolved colors. The panel
					// decodes it for display, but needs the preset reference
					// to know which preset is applied: two presets can hold
					// the same pair of colors, and resolving first throws the
					// slug away.
					value={ {
						filter: { duotone: duotoneStyle },
					} }
					onChange={ ( newDuotone: PanelStyle ) => {
						const newStyle = {
							...style,
							color: {
								...newDuotone?.filter,
							},
						};
						setAttributes( {
							style: cleanEmptyObject( newStyle ),
						} );
					} }
					settings={ settings }
					inheritedValue={ inheritedValue }
				/>
			</InspectorControls>
			<BlockControls group="block" __experimentalShareWithChildBlocks>
				<DuotoneControl
					duotonePalette={ duotonePalette }
					colorPalette={ colorPalette }
					disableCustomDuotone={ disableCustomDuotone }
					disableCustomColors={ disableCustomColors }
					value={ duotonePresetOrColors }
					selectedSlug={ getDuotoneSlugFromPreset( duotoneStyle ) }
					onChange={ ( newDuotone, index, slug ) => {
						// A slug means a preset was picked out of the palette,
						// so it identifies the choice exactly. Matching back by
						// color would resolve to whichever preset holding those
						// colors comes first, which is the wrong one whenever
						// two presets share a pair.
						const maybePreset = slug
							? `var:preset|duotone|${ slug }`
							: getDuotonePresetFromColors(
									newDuotone,
									duotonePalette
								);

						const newStyle = {
							...style,
							color: {
								...style?.color,
								duotone: maybePreset ?? newDuotone, // use preset or fallback to custom colors.
							},
						};
						setAttributes( {
							style: cleanEmptyObject( newStyle ),
						} );
					} }
					// @ts-expect-error `DuotoneControl` ignores `settings`.
					settings={ settings }
				/>
			</BlockControls>
		</>
	);
}

export default {
	shareWithChildBlocks: true,
	edit: DuotonePanelPure,
	useBlockProps,
	attributeKeys: [ 'style' ],
	hasSupport( name: string | BlockType ) {
		return hasBlockSupport( name, 'filter.duotone' );
	},
};

/**
 * Filters registered block settings, extending attributes to include
 * the `duotone` attribute.
 *
 * @param settings Original block settings.
 *
 * @return Filtered block settings.
 */
function addDuotoneAttributes( settings: BlockType ): BlockType {
	// Previous `color.__experimentalDuotone` support flag is migrated via
	// block_type_metadata_settings filter in `lib/block-supports/duotone.php`.
	if ( ! hasBlockSupport( settings, 'filter.duotone' ) ) {
		return settings;
	}

	// Allow blocks to specify their own attribute definition with default
	// values if needed.
	if ( ! settings.attributes.style ) {
		Object.assign( settings.attributes, {
			style: {
				type: 'object',
			},
		} );
	}

	return settings;
}

function useDuotoneStyles( {
	clientId,
	id: filterId,
	selector: duotoneSelector,
	attribute: duotoneAttr,
}: DuotoneStylesOptions ) {
	const duotonePalette = useMultiOriginPresets< DuotonePreset >( {
		presetSetting: 'color.duotone',
		defaultSetting: 'color.defaultDuotone',
	} );

	// Possible values for duotone attribute:
	// 1. Array of colors - e.g. ['#000000', '#ffffff'].
	// 2. Variable for an existing Duotone preset - e.g. 'var:preset|duotone|green-blue' or 'var(--wp--preset--duotone--green-blue)''
	// 3. A CSS string - e.g. 'unset' to remove globally applied duotone.
	const isCustom = Array.isArray( duotoneAttr );
	const duotonePreset = isCustom
		? undefined
		: getColorsFromDuotonePreset( duotoneAttr, duotonePalette );
	const isPreset = typeof duotoneAttr === 'string' && duotonePreset;
	const isCSS = typeof duotoneAttr === 'string' && ! isPreset;

	// Match the structure of WP_Duotone_Gutenberg::render_duotone_support() in PHP.
	let colors: DuotoneValue | null = null;
	if ( isPreset ) {
		// Array of colors.
		colors = duotonePreset;
	} else if ( isCSS ) {
		// CSS filter property string (e.g. 'unset').
		colors = duotoneAttr;
	} else if ( isCustom ) {
		// Array of colors.
		colors = duotoneAttr;
	}

	// Build the CSS selectors to which the filter will be applied.
	const selectors = duotoneSelector.split( ',' );

	const selectorsScoped = selectors.map( ( selectorPart ) => {
		// Assuming the selector part is a subclass selector (not a tag name)
		// so we can prepend the filter id class. If we want to support elements
		// such as `img` or namespaces, we'll need to add a case for that here.
		return `.${ filterId }${ selectorPart.trim() }`;
	} );

	const selector = selectorsScoped.join( ', ' );

	const isValidFilter = Array.isArray( colors ) || colors === 'unset';

	usePrivateStyleOverride(
		isValidFilter
			? {
					css:
						colors !== 'unset'
							? getDuotoneStylesheet( selector, filterId )
							: getDuotoneUnsetStylesheet( selector ),
					__unstableType: 'presets',
				}
			: undefined
	);
	usePrivateStyleOverride(
		isValidFilter
			? {
					assets:
						colors !== 'unset'
							? getDuotoneFilter( filterId, colors )
							: '',
					__unstableType: 'svgs',
				}
			: undefined
	);

	// Blocks render HTML elements.
	const blockElement = useBlockElement( clientId ) as HTMLElement | null;

	useEffect( () => {
		if ( ! isValidFilter ) {
			return;
		}

		// Safari does not always update the duotone filter when the duotone
		// colors are changed. When using Safari, force the block element to be
		// repainted by the browser to ensure any changes are reflected
		// visually. This logic matches that used on the site frontend in
		// `block-supports/duotone.php`.
		if ( blockElement && isSafari ) {
			const display = blockElement.style.display;
			// Switch to `inline-block` to force a repaint. In the editor,
			// `inline-block` is used instead of `none` to ensure that scroll
			// position is not affected, as `none` results in the editor
			// scrolling to the top of the block.
			blockElement.style.setProperty( 'display', 'inline-block' );
			// Simply accessing el.offsetHeight flushes layout and style changes
			// in WebKit without having to wait for setTimeout.
			// eslint-disable-next-line no-unused-expressions
			blockElement.offsetHeight;
			blockElement.style.setProperty( 'display', display );
		}
		// `colors` must be a dependency so this effect runs when the colors
		// change in Safari.
	}, [ isValidFilter, blockElement, colors ] );
}

// Used for generating the instance ID
const DUOTONE_BLOCK_PROPS_REFERENCE = {};

function useBlockProps( {
	clientId,
	name,
	style,
}: BlockListBlockFeatureProps & { style?: PanelStyle } ) {
	const id = useInstanceId( DUOTONE_BLOCK_PROPS_REFERENCE );
	const selector = useMemo( () => {
		const blockType = getBlockType( name );

		if ( blockType ) {
			// Backwards compatibility for `supports.color.__experimentalDuotone`
			// is provided via the `block_type_metadata_settings` filter. If
			// `supports.filter.duotone` has not been set and the
			// experimental property has been, the experimental property
			// value is copied into `supports.filter.duotone`.
			const duotoneSupport = getBlockSupport(
				blockType,
				'filter.duotone',
				false
			);
			if ( ! duotoneSupport ) {
				return null;
			}

			// If the experimental duotone support was set, that value is
			// to be treated as a selector and requires scoping.
			const experimentalDuotone = getBlockSupport(
				blockType,
				'color.__experimentalDuotone',
				false
			);
			if ( experimentalDuotone ) {
				const rootSelector = getBlockSelector( blockType );
				return typeof experimentalDuotone === 'string'
					? scopeSelector( rootSelector, experimentalDuotone )
					: rootSelector;
			}

			// Regular filter.duotone support uses filter.duotone selectors with fallbacks.
			return getBlockSelector( blockType, 'filter.duotone', {
				fallback: true,
			} );
		}
		return undefined;
	}, [ name ] );

	// The duotone style holds a preset reference, colors or a CSS value.
	const attribute = style?.color?.duotone as DuotoneValue | undefined;

	const filterClass = `wp-duotone-${ id }`;

	const shouldRender = selector && attribute;

	useDuotoneStyles( {
		clientId,
		id: filterClass,
		// Blocks with duotone support have a selector.
		selector: selector as string,
		attribute,
	} );

	return {
		className: shouldRender ? filterClass : '',
	};
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/duotone/add-attributes',
	addDuotoneAttributes
);
