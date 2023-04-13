/**
 * External dependencies
 */
import classnames from 'classnames';
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
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { useMemo, useContext, createPortal } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	BlockControls,
	__experimentalDuotoneControl as DuotoneControl,
	useSetting,
} from '../components';
import BlockList from '../components/block-list';
import {
	__unstableDuotoneFilter as DuotoneFilter,
	__unstableDuotoneStylesheet as DuotoneStylesheet,
	__unstableDuotoneUnsetStylesheet as DuotoneUnsetStylesheet,
} from '../components/duotone';
import { getBlockCSSSelector } from '../components/global-styles/get-block-css-selector';
import { scopeSelector } from '../components/global-styles/utils';
import { store as blockEditorStore } from '../store';

const EMPTY_ARRAY = [];

extend( [ namesPlugin ] );

/**
 * SVG and stylesheet needed for rendering the duotone filter.
 *
 * @param {Object}           props          Duotone props.
 * @param {string}           props.selector Selector to apply the filter to.
 * @param {string}           props.id       Unique id for this duotone filter.
 * @param {string[]|"unset"} props.colors   Array of RGB color strings ordered from dark to light.
 *
 * @return {WPElement} Duotone element.
 */
function InlineDuotone( { selector, id, colors } ) {
	if ( colors === 'unset' ) {
		return <DuotoneUnsetStylesheet selector={ selector } />;
	}

	return (
		<>
			<DuotoneFilter id={ id } colors={ colors } />
			<DuotoneStylesheet id={ id } selector={ selector } />
		</>
	);
}

function useMultiOriginPresets( { presetSetting, defaultSetting } ) {
	const disableDefault = ! useSetting( defaultSetting );
	const userPresets =
		useSetting( `${ presetSetting }.custom` ) || EMPTY_ARRAY;
	const themePresets =
		useSetting( `${ presetSetting }.theme` ) || EMPTY_ARRAY;
	const defaultPresets =
		useSetting( `${ presetSetting }.default` ) || EMPTY_ARRAY;
	return useMemo(
		() => [
			...userPresets,
			...themePresets,
			...( disableDefault ? EMPTY_ARRAY : defaultPresets ),
		],
		[ disableDefault, userPresets, themePresets, defaultPresets ]
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

function DuotonePanel( { attributes, setAttributes } ) {
	const style = attributes?.style;
	const duotoneStyle = style?.color?.duotone;

	const duotonePalette = useMultiOriginPresets( {
		presetSetting: 'color.duotone',
		defaultSetting: 'color.defaultDuotone',
	} );
	const colorPalette = useMultiOriginPresets( {
		presetSetting: 'color.palette',
		defaultSetting: 'color.defaultPalette',
	} );
	const disableCustomColors = ! useSetting( 'color.custom' );
	const disableCustomDuotone =
		! useSetting( 'color.customDuotone' ) ||
		( colorPalette?.length === 0 && disableCustomColors );

	if ( duotonePalette?.length === 0 && disableCustomDuotone ) {
		return null;
	}

	const duotonePresetOrColors = ! Array.isArray( duotoneStyle )
		? getColorsFromDuotonePreset( duotoneStyle, duotonePalette )
		: duotoneStyle;

	return (
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
			/>
		</BlockControls>
	);
}

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

/**
 * Override the default edit UI to include toolbar controls for duotone if the
 * block supports duotone.
 *
 * @param {Function} BlockEdit Original component.
 *
 * @return {Function} Wrapped component.
 */
const withDuotoneControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		// Previous `color.__experimentalDuotone` support flag is migrated via
		// block_type_metadata_settings filter in `lib/block-supports/duotone.php`.
		const hasDuotoneSupport = hasBlockSupport(
			props.name,
			'filter.duotone'
		);

		const isContentLocked = useSelect(
			( select ) => {
				return select(
					blockEditorStore
				).__unstableGetContentLockingParent( props.clientId );
			},
			[ props.clientId ]
		);

		// CAUTION: code added before this line will be executed
		// for all blocks, not just those that support duotone. Code added
		// above this line should be carefully evaluated for its impact on
		// performance.
		return (
			<>
				{ hasDuotoneSupport && ! isContentLocked && (
					<DuotonePanel { ...props } />
				) }
				<BlockEdit { ...props } />
			</>
		);
	},
	'withDuotoneControls'
);

function DuotoneStyles( {
	id: filterId,
	selector: duotoneSelector,
	attribute: duotoneAttr,
} ) {
	const element = useContext( BlockList.__unstableElementContext );

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
		return `.editor-styles-wrapper .${ filterId }${ selectorPart.trim() }`;
	} );

	const selector = selectorsScoped.join( ', ' );

	const isValidFilter = Array.isArray( colors ) || colors === 'unset';

	return (
		element &&
		isValidFilter &&
		createPortal(
			<InlineDuotone
				selector={ selector }
				id={ filterId }
				colors={ colors }
			/>,
			element
		)
	);
}

/**
 * Override the default block element to include duotone styles.
 *
 * @param {Function} BlockListBlock Original component.
 *
 * @return {Function} Wrapped component.
 */
const withDuotoneStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const id = useInstanceId( BlockListBlock );

		const selector = useMemo( () => {
			const blockType = getBlockType( props.name );

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
		}, [ props.name ] );

		const attribute = props?.attributes?.style?.color?.duotone;

		const filterClass = `wp-duotone-${ id }`;

		const shouldRender = selector && attribute;

		const className = shouldRender
			? classnames( props?.className, filterClass )
			: props?.className;

		// CAUTION: code added before this line will be executed
		// for all blocks, not just those that support duotone. Code added
		// above this line should be carefully evaluated for its impact on
		// performance.
		return (
			<>
				{ shouldRender && (
					<DuotoneStyles
						id={ filterClass }
						selector={ selector }
						attribute={ attribute }
					/>
				) }
				<BlockListBlock { ...props } className={ className } />
			</>
		);
	},
	'withDuotoneStyles'
);

addFilter(
	'blocks.registerBlockType',
	'core/editor/duotone/add-attributes',
	addDuotoneAttributes
);
addFilter(
	'editor.BlockEdit',
	'core/editor/duotone/with-editor-controls',
	withDuotoneControls
);
addFilter(
	'editor.BlockListBlock',
	'core/editor/duotone/with-styles',
	withDuotoneStyles
);
