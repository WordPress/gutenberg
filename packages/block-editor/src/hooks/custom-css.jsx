import { useEffect, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import {
	processCSSNesting,
	privateApis as globalStylesEnginePrivateApis,
} from '@wordpress/global-styles-engine';
import { store as noticesStore } from '@wordpress/notices';
import { useBlockEditingMode } from '../components/block-editing-mode';
import InspectorControls from '../components/inspector-controls';
import AdvancedPanel, {
	validateCSS,
} from '../components/global-styles/advanced-panel';
import { cleanEmptyObject, usePrivateStyleOverride } from './utils';
import {
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
	isDefaultBlockStyleState,
	setStyleForState,
} from './block-style-state';
import { VALID_BLOCK_PSEUDO_STATES } from './states';
import { useSettings } from '../components/use-settings';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';

const { getResponsiveMediaQueries } = unlock( globalStylesEnginePrivateApis );

// Breakpoint keys that can carry their own state style objects (and, in turn,
// their own `css` value). Used as a fallback when viewport settings aren't
// available (e.g. in `addSaveProps`, which runs outside any block context).
// When settings are available, breakpoints are derived dynamically instead
// via `getResponsiveMediaQueries`, so this only needs to match the current
// breakpoints for the no-settings fallback case.
const RESPONSIVE_STATE_KEYS = [ '@mobile', '@tablet' ];

// Stable reference for useInstanceId.
const CUSTOM_CSS_INSTANCE_REFERENCE = {};

// Stable empty object reference for useSelect.
const EMPTY_STYLE = {};

/**
 * Collects every custom CSS state entry defined for a block instance, across
 * the default state, pseudo-states, and viewport states (including
 * combinations of the two), in the same order as the server-side collection
 * in `gutenberg_get_custom_css_state_entries()`. Used both to validate a
 * block's custom CSS and to generate its preview CSS, so there is a single
 * traversal of the style tree to keep in sync rather than two.
 *
 * @param {Object} style              Block style attribute.
 * @param {string} blockName          Block name.
 * @param {Object} [viewportSettings] Viewport breakpoint settings. When
 *                                    omitted (e.g. from `addSaveProps`, which
 *                                    runs outside any block context),
 *                                    breakpoints fall back to the static
 *                                    `RESPONSIVE_STATE_KEYS` list and entries
 *                                    are returned without a `mediaQuery`.
 * @return {Object[]} Entries with `css`, `pseudoState` (string|undefined),
 *                     and `mediaQuery` (string|undefined) keys.
 */
function getCustomCSSStateEntries( style, blockName, viewportSettings ) {
	const entries = [];
	const pseudoStates = VALID_BLOCK_PSEUDO_STATES[ blockName ] ?? [];

	const addEntry = ( node, pseudoState, mediaQuery ) => {
		if ( typeof node?.css === 'string' && node.css.trim() ) {
			entries.push( { css: node.css, pseudoState, mediaQuery } );
		}
	};

	addEntry( style );
	pseudoStates.forEach( ( pseudoState ) =>
		addEntry( style?.[ pseudoState ], pseudoState )
	);

	const breakpoints = viewportSettings
		? Object.entries( getResponsiveMediaQueries( viewportSettings ) )
		: RESPONSIVE_STATE_KEYS.map( ( breakpoint ) => [ breakpoint ] );

	breakpoints.forEach( ( [ breakpoint, mediaQuery ] ) => {
		const breakpointStyle = style?.[ breakpoint ];
		if ( ! breakpointStyle ) {
			return;
		}
		addEntry( breakpointStyle, undefined, mediaQuery );
		pseudoStates.forEach( ( pseudoState ) =>
			addEntry(
				breakpointStyle?.[ pseudoState ],
				pseudoState,
				mediaQuery
			)
		);
	} );

	return entries;
}

/**
 * Generates preview CSS for a block instance's custom CSS state entries,
 * mirroring the server-side rendering in
 * `gutenberg_render_custom_css_support_styles()`.
 *
 * @param {Object[]} entries      Entries from `getCustomCSSStateEntries()`.
 * @param {string}   baseSelector Selector scoping this block instance.
 * @return {string|undefined} Generated CSS, or undefined if there is none.
 */
function renderCustomCSSStateEntries( entries, baseSelector ) {
	const rules = [];

	entries.forEach( ( { css, pseudoState, mediaQuery } ) => {
		const selector = pseudoState
			? `${ baseSelector }${ pseudoState }`
			: baseSelector;
		const processed = processCSSNesting( css, selector );
		if ( ! processed ) {
			return;
		}
		rules.push(
			mediaQuery ? `${ mediaQuery }{${ processed }}` : processed
		);
	} );

	return rules.length ? rules.join( '\n' ) : undefined;
}

/**
 * Inspector control for custom CSS.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.blockName     Block name.
 * @param {Function} props.setAttributes Function to set block attributes.
 * @param {Object}   props.style         Block style attribute.
 * @param {Object}   props.selectedState Currently selected block style state.
 */
function CustomCSSControl( {
	blockName,
	setAttributes,
	style,
	selectedState,
} ) {
	const blockEditingMode = useBlockEditingMode();

	if ( blockEditingMode !== 'default' ) {
		return null;
	}
	const blockType = getBlockType( blockName );
	const isStateSelected = ! isDefaultBlockStyleState( selectedState );
	const stateStyle = isStateSelected
		? getStyleForState( style, selectedState ) || {}
		: style;
	// A viewport state (and no pseudo-state) is edited via the dedicated
	// "viewport" InspectorControls group, rendered at the bottom of the
	// inspector rather than folded under the "Advanced" panel.
	const isViewportState =
		selectedState?.viewport !== DEFAULT_BLOCK_STYLE_STATE.viewport &&
		selectedState?.pseudo === DEFAULT_BLOCK_STYLE_STATE.pseudo;

	function onChange( newStyle ) {
		// Normalize whitespace-only CSS to undefined so it gets cleaned up.
		const css = newStyle?.css?.trim() ? newStyle.css : undefined;
		const cleanedStyle = cleanEmptyObject( { ...newStyle, css } );
		setAttributes( {
			style: isStateSelected
				? setStyleForState( style, selectedState, cleanedStyle )
				: cleanedStyle,
		} );
	}

	const cssHelpText = sprintf(
		// translators: %s: is the name of a block e.g., 'Image' or 'Quote'.
		__(
			'Add your own CSS to customize the appearance of the %s block. You do not need to include a CSS selector, just add the property and value, e.g. color: red;.'
		),
		blockType?.title
	);

	return (
		<InspectorControls group={ isViewportState ? 'viewport' : 'advanced' }>
			<AdvancedPanel
				value={ stateStyle }
				onChange={ onChange }
				help={ cssHelpText }
			/>
		</InspectorControls>
	);
}

const CUSTOM_CSS_WARNING_NOTICE_ID = 'custom-css-edit-warning';

function CustomCSSEdit( { clientId, name, setAttributes } ) {
	const { style, canEditCSS, selectedState } = useSelect(
		( select ) => {
			const blockEditorSelect = select( blockEditorStore );
			const { getSelectedBlockStyleState } = unlock( blockEditorSelect );
			return {
				style:
					blockEditorSelect.getBlockAttributes( clientId )?.style ||
					EMPTY_STYLE,
				canEditCSS: blockEditorSelect.getSettings().canEditCSS,
				selectedState: getSelectedBlockStyleState( clientId ),
			};
		},
		[ clientId ]
	);

	// Don't render the panel if user lacks edit_css capability.
	if ( ! canEditCSS ) {
		return null;
	}

	return (
		<CustomCSSControl
			blockName={ name }
			setAttributes={ setAttributes }
			style={ style }
			selectedState={ selectedState }
		/>
	);
}

/**
 * Hook to handle custom CSS for a block in the editor.
 * Generates a unique class and applies scoped CSS via style override.
 *
 * @param {Object} props          Block props.
 * @param {Object} props.style    Block style attribute.
 * @param {string} props.clientId Block client ID.
 * @param {string} props.name     Block name.
 * @return {Object} Block props including className for custom CSS scoping.
 */
function useBlockProps( { style, clientId, name } ) {
	const [ viewportSettings ] = useSettings( 'viewport' );

	const customCSSStateEntries = useMemo(
		() => getCustomCSSStateEntries( style, name, viewportSettings ),
		[ style, name, viewportSettings ]
	);

	// Valid when there is at least one non-empty custom CSS value across all
	// states and none of them contain HTML markup. A single invalid state
	// invalidates the whole block's custom CSS, matching the server-side
	// rendering in gutenberg_render_custom_css_support_styles().
	const isValidCSS =
		customCSSStateEntries.length > 0 &&
		customCSSStateEntries.every( ( entry ) => validateCSS( entry.css ) );

	const canEditCSS = useSelect(
		( select ) => select( blockEditorStore ).getSettings().canEditCSS,
		[]
	);

	const { createWarningNotice } = useDispatch( noticesStore );

	// Show a warning notice when the user lacks edit_css and a block has
	// custom CSS. The fixed notice ID ensures only one notice is shown
	// regardless of how many blocks have CSS.
	const hasCustomCSS = customCSSStateEntries.length > 0;
	useEffect( () => {
		if ( ! canEditCSS && hasCustomCSS ) {
			createWarningNotice(
				__(
					'This post contains blocks with custom CSS. You do not have permission to edit CSS. If you save this post, the custom CSS will be removed.'
				),
				{
					id: CUSTOM_CSS_WARNING_NOTICE_ID,
					isDismissible: true,
				}
			);
		}
	}, [ canEditCSS, hasCustomCSS, createWarningNotice ] );

	const customCSSIdentifier = useInstanceId(
		CUSTOM_CSS_INSTANCE_REFERENCE,
		'wp-custom-css'
	);

	const customCSSSelector = `.${ customCSSIdentifier }`;

	// Transform the custom CSS using the same logic as global styles.
	// Only process if CSS is valid (doesn't contain HTML markup).
	const transformedCSS = useMemo( () => {
		if ( ! isValidCSS ) {
			return undefined;
		}
		return renderCustomCSSStateEntries(
			customCSSStateEntries,
			customCSSSelector
		);
	}, [ isValidCSS, customCSSStateEntries, customCSSSelector ] );

	// Inject the CSS via style override. The type makes EditorStyles print
	// it after all other overrides (e.g. block style variations), matching
	// the front end where the custom CSS stylesheet is printed last. The
	// clientId keeps custom CSS overrides in block order relative to each
	// other, which is the order they print in on the front end.
	usePrivateStyleOverride( {
		css: transformedCSS,
		clientId,
		__unstableType: 'custom-css',
	} );

	// Only add the class if there's valid custom CSS.
	if ( ! isValidCSS ) {
		return {};
	}

	return {
		className: `has-custom-css ${ customCSSIdentifier }`,
	};
}

/**
 * Adds a marker class to blocks with custom CSS for server-side rendering.
 *
 * @param {Object} props      Additional props applied to save element.
 * @param {Object} blockType  Block type definition.
 * @param {Object} attributes Block's attributes.
 * @return {Object} Filtered props applied to save element.
 */
function addSaveProps( props, blockType, attributes ) {
	if ( ! hasBlockSupport( blockType, 'customCSS', true ) ) {
		return props;
	}

	if (
		! getCustomCSSStateEntries( attributes?.style, blockType.name ).length
	) {
		return props;
	}

	// Add a class to indicate this block has custom CSS.
	// The actual CSS is rendered server-side using the render_block filter.
	const className = props.className
		? `${ props.className } has-custom-css`
		: 'has-custom-css';

	return {
		...props,
		className,
	};
}

export default {
	edit: CustomCSSEdit,
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'style' ],
	hasSupport( name ) {
		return hasBlockSupport( name, 'customCSS', true );
	},
};
