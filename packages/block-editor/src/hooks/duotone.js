/**
 * External dependencies
 */
import { extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

/**
 * WordPress dependencies
 */
import {
	getBlockSupport,
	getBlockType,
	hasBlockSupport,
} from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { useMemo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	BlockControls,
	InspectorControls,
	__experimentalDuotoneControl as DuotoneControl,
	useSettings,
} from '../components';
import {
	getDuotoneFilter,
	getDuotoneStylesheet,
	getDuotoneUnsetStylesheet,
} from '../components/duotone/utils';
import { getBlockCSSSelector } from '../components/global-styles/get-block-css-selector';
import { scopeSelector } from '../components/global-styles/utils';
import { useBlockSettings, usePrivateStyleOverride } from './utils';
import { default as StylesFiltersPanel } from '../components/global-styles/filters-panel';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';

const EMPTY_ARRAY = [];

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

function useMultiOriginPresets( { presetSetting, defaultSetting } ) {
	const [ enableDefault, userPresets, themePresets, defaultPresets ] =
		useSettings(
			defaultSetting,
			`${ presetSetting }.custom`,
			`${ presetSetting }.theme`,
			`${ presetSetting }.default`
		);
	return useMemo(
		() => [
			...( userPresets || EMPTY_ARRAY ),
			...( themePresets || EMPTY_ARRAY ),
			...( ( enableDefault && defaultPresets ) || EMPTY_ARRAY ),
		],
		[ enableDefault, userPresets, themePresets, defaultPresets ]
	);
}

export function getColorsFromDuotonePreset( duotone, duotonePalette ) {
	if ( ! duotone ) {
		return;
	}
	const preset = duotonePalette?.find( ( { slug } ) => {
		return duotone === `var:preset|duotone|${ slug }`;
	} );

	return preset ? preset.colors : undefined;
}

export function getDuotonePresetFromColors( colors, duotonePalette ) {
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

function DuotonePanelPure( { style, setAttributes, name } ) {
	const duotoneStyle = style?.color?.duotone;
	const settings = useBlockSettings( name );
	const blockEditingMode = useBlockEditingMode();

	const duotonePalette = useMultiOriginPresets( {
		presetSetting: 'color.duotone',
		defaultSetting: 'color.defaultDuotone',
	} );
	const colorPalette = useMultiOriginPresets( {
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

	const duotonePresetOrColors = ! Array.isArray( duotoneStyle )
		? getColorsFromDuotonePreset( duotoneStyle, duotonePalette )
		: duotoneStyle;

	return (
		<>
			<InspectorControls group="filter">
				<StylesFiltersPanel
					value={ { filter: { duotone: duotonePresetOrColors } } }
					onChange={ ( newDuotone ) => {
						const newStyle = {
							...style,
							color: {
								...newDuotone?.filter,
							},
						};
						setAttributes( { style: newStyle } );
					} }
					settings={ settings }
				/>
			</InspectorControls>
			<BlockControls group="block" __experimentalShareWithChildBlocks>
				<DuotoneControl
					duotonePalette={ duotonePalette }
					colorPalette={ colorPalette }
					disableCustomDuotone={ disableCustomDuotone }
					disableCustomColors={ disableCustomColors }
					value={ duotonePresetOrColors }
					onChange={ ( newDuotone ) => {
						const maybePreset = getDuotonePresetFromColors(
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
						setAttributes( { style: newStyle } );
					} }
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
	hasSupport( name ) {
		return hasBlockSupport( name, 'filter.duotone' );
	},
};

/**
 * Filters registered block settings, extending attributes to include
 * the `duotone` attribute.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addDuotoneAttributes( settings ) {
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
} ) {
	const duotonePalette = useMultiOriginPresets( {
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
	let colors = null;
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
		// Extra .editor-styles-wrapper specificity is needed in the editor
		// since we're not using inline styles to apply the filter. We need to
		// override duotone applied by global styles and theme.json.

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

	const blockElement = useBlockElement( clientId );

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
			blockElement.style.display = 'inline-block';
			// Simply accessing el.offsetHeight flushes layout and style changes
			// in WebKit without having to wait for setTimeout.
			// eslint-disable-next-line no-unused-expressions
			blockElement.offsetHeight;
			blockElement.style.display = display;
		}
		// `colors` must be a dependency so this effect runs when the colors
		// change in Safari.
	}, [ isValidFilter, blockElement, colors ] );
}

function useBlockProps( { clientId, name, style } ) {
	const id = useInstanceId( useBlockProps );
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
				const rootSelector = getBlockCSSSelector( blockType );
				return typeof experimentalDuotone === 'string'
					? scopeSelector( rootSelector, experimentalDuotone )
					: rootSelector;
			}

			// Regular filter.duotone support uses filter.duotone selectors with fallbacks.
			return getBlockCSSSelector( blockType, 'filter.duotone', {
				fallback: true,
			} );
		}
	}, [ name ] );

	const attribute = style?.color?.duotone;

	const filterClass = `wp-duotone-${ id }`;

	const shouldRender = selector && attribute;

	useDuotoneStyles( {
		clientId,
		id: filterClass,
		selector,
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
