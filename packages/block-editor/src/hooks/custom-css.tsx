import { useEffect, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { PanelBody } from '@wordpress/components';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import {
	processCSSNesting,
	privateApis as globalStylesEnginePrivateApis,
} from '@wordpress/global-styles-engine';
import { store as noticesStore } from '@wordpress/notices';
import { useBlockEditingMode } from '../components/block-editing-mode';
import InspectorControls from '../components/inspector-controls';
import { PrivateInspectorControlsStyleStateAdvanced } from '../components/inspector-controls/groups';
import AdvancedPanel, {
	validateCSS,
} from '../components/global-styles/advanced-panel';
import { cleanEmptyObject, usePrivateStyleOverride } from './utils';
import {
	getStyleForState,
	isDefaultBlockStyleState,
	setStyleForState,
} from './block-style-state';
import { VALID_BLOCK_PSEUDO_STATES } from './states';
import { useSettings } from '../components/use-settings';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import type { PanelStyle } from '../components/global-styles/types';
import type {
	BlockSupportEditProps,
	BlockWrapperProps,
	CustomCSSControlProps,
	CustomCSSStateEntry,
} from './types';

const { getResponsiveMediaQueries } = unlock( globalStylesEnginePrivateApis );

// Stable reference for useInstanceId.
const CUSTOM_CSS_INSTANCE_REFERENCE = {};

// Stable empty object reference for useSelect.
const EMPTY_STYLE: PanelStyle = {};

function hasCustomCSSString(
	node: PanelStyle | undefined
): node is PanelStyle & { css: string } {
	return typeof node?.css === 'string' && node.css.trim() !== '';
}

/**
 * Collects every custom CSS state entry defined for a block instance, across
 * the default state, pseudo-states, and viewport states (including
 * combinations of the two), in the same order as the server-side collection
 * in `gutenberg_get_custom_css_state_entries()`. Used both to validate a
 * block's custom CSS and to generate its preview CSS, so there is a single
 * traversal of the style tree to keep in sync rather than two.
 *
 * @param style            Block style attribute.
 * @param blockName        Block name.
 * @param viewportSettings Viewport breakpoint settings. When
 *                         omitted (e.g. from `addSaveProps`, which
 *                         runs outside any block context),
 *                         the default responsive breakpoints and
 *                         their media queries are used.
 * @return Entries with `css`, `pseudoState` (string|undefined),
 *         and `mediaQuery` (string|undefined) keys.
 */
function getCustomCSSStateEntries(
	style: PanelStyle | undefined,
	blockName: string,
	viewportSettings?: unknown
) {
	const entries: CustomCSSStateEntry[] = [];
	const pseudoStates = VALID_BLOCK_PSEUDO_STATES[ blockName ] ?? [];

	if ( hasCustomCSSString( style ) ) {
		entries.push( { css: style.css } );
	}

	for ( const pseudoState of pseudoStates ) {
		// The valid pseudo states start with a colon.
		const pseudoStyle = style?.[ pseudoState as `:${ string }` ];
		if ( hasCustomCSSString( pseudoStyle ) ) {
			entries.push( { css: pseudoStyle.css, pseudoState } );
		}
	}

	for ( const [ breakpoint, mediaQuery ] of Object.entries(
		getResponsiveMediaQueries( viewportSettings ) as Record<
			string,
			string
		>
	) ) {
		// A viewport state holds styles of the block's shape.
		const breakpointStyle = style?.[ breakpoint ] as PanelStyle | undefined;
		if ( hasCustomCSSString( breakpointStyle ) ) {
			entries.push( { css: breakpointStyle.css, mediaQuery } );
		}

		for ( const pseudoState of pseudoStates ) {
			// The valid pseudo states start with a colon.
			const breakpointPseudoStyle =
				breakpointStyle?.[ pseudoState as `:${ string }` ];
			if ( hasCustomCSSString( breakpointPseudoStyle ) ) {
				entries.push( {
					css: breakpointPseudoStyle.css,
					pseudoState,
					mediaQuery,
				} );
			}
		}
	}

	return entries;
}

/**
 * Generates preview CSS for a block instance's custom CSS state entries,
 * mirroring the server-side rendering in
 * `gutenberg_render_custom_css_support_styles()`.
 *
 * @param entries      Entries from `getCustomCSSStateEntries()`.
 * @param baseSelector Selector scoping this block instance.
 * @return Generated CSS, or undefined if there are no rules.
 */
export function processCustomCSSStateEntries(
	entries: CustomCSSStateEntry[],
	baseSelector: string
) {
	const rules: string[] = [];

	entries.forEach( ( { css, pseudoState, mediaQuery } ) => {
		if ( ! validateCSS( css ) ) {
			return;
		}

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
 * @param props               Component props.
 * @param props.blockName     Block name.
 * @param props.setAttributes Function to set block attributes.
 * @param props.style         Block style attribute.
 * @param props.selectedState Currently selected block style state.
 */
function CustomCSSControl( {
	blockName,
	setAttributes,
	style,
	selectedState,
}: CustomCSSControlProps ) {
	const blockEditingMode = useBlockEditingMode();

	if ( blockEditingMode !== 'default' ) {
		return null;
	}
	const blockType = getBlockType( blockName );
	const isStateSelected = ! isDefaultBlockStyleState( selectedState );
	const stateStyle = isStateSelected
		? // The state styles have the shape of the block styles.
			( getStyleForState( style, selectedState ) as
				PanelStyle | undefined ) || {}
		: style;

	function onChange( newStyle: PanelStyle ) {
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
		// An unknown block prints as `undefined`, as before.
		blockType?.title as string
	);

	const panel = (
		<AdvancedPanel
			value={ stateStyle }
			onChange={ onChange }
			help={ cssHelpText }
		/>
	);

	if ( isStateSelected ) {
		return (
			<PrivateInspectorControlsStyleStateAdvanced.Fill>
				<PanelBody title={ __( 'Advanced' ) }>{ panel }</PanelBody>
			</PrivateInspectorControlsStyleStateAdvanced.Fill>
		);
	}

	return <InspectorControls group="advanced">{ panel }</InspectorControls>;
}

const CUSTOM_CSS_WARNING_NOTICE_ID = 'custom-css-edit-warning';

function CustomCSSEdit( {
	clientId,
	name,
	setAttributes,
}: BlockSupportEditProps ) {
	const { style, canEditCSS, selectedState } = useSelect(
		( select ) => {
			const blockEditorSelect = select( blockEditorStore );
			const { getSelectedBlockStyleState } = unlock( blockEditorSelect );
			return {
				// The style attribute holds the block styles.
				style:
					( blockEditorSelect.getBlockAttributes( clientId )
						?.style as PanelStyle | undefined ) || EMPTY_STYLE,
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
 * @param props          Block props.
 * @param props.style    Block style attribute.
 * @param props.clientId Block client ID.
 * @param props.name     Block name.
 * @return Block props including className for custom CSS scoping.
 */
function useBlockProps( {
	style,
	clientId,
	name,
}: {
	style?: PanelStyle;
	clientId: string;
	name: string;
} ) {
	const [ viewportSettings ] = useSettings( 'viewport' );

	const customCSSStateEntries = useMemo(
		() => getCustomCSSStateEntries( style, name, viewportSettings ),
		[ style, name, viewportSettings ]
	);

	// Keep valid CSS states even when another state contains HTML markup,
	// matching the server-side rendering in
	// gutenberg_render_custom_css_support_styles().
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
	// Only process CSS states that don't contain HTML markup.
	const transformedCSS = useMemo(
		() =>
			processCustomCSSStateEntries(
				customCSSStateEntries,
				customCSSSelector
			),
		[ customCSSStateEntries, customCSSSelector ]
	);

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

	// Only add the class if custom CSS produced rules.
	if ( ! transformedCSS ) {
		return {};
	}

	return {
		className: `has-custom-css ${ customCSSIdentifier }`,
	};
}

/**
 * Adds a marker class to blocks with custom CSS for server-side rendering.
 *
 * @param props            Additional props applied to save element.
 * @param blockType        Block type definition.
 * @param attributes       Block's attributes.
 * @param attributes.style Block style attribute.
 * @return Filtered props applied to save element.
 */
function addSaveProps(
	props: BlockWrapperProps,
	blockType: BlockType,
	attributes: { style?: PanelStyle }
): BlockWrapperProps {
	if ( ! hasBlockSupport( blockType, 'customCSS', true ) ) {
		return props;
	}

	const customCSSStateEntries = getCustomCSSStateEntries(
		attributes?.style,
		blockType.name
	);
	if (
		! processCustomCSSStateEntries(
			customCSSStateEntries,
			'.wp-custom-css'
		)
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
	hasSupport( name: string | BlockType ) {
		return hasBlockSupport( name, 'customCSS', true );
	},
};
