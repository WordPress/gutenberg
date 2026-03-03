/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { getBlockSupport } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
import { useInstanceId } from '@wordpress/compose';
import { Button, Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { useStyleOverride, cleanEmptyObject } from './utils';
import InspectorControls from '../components/inspector-controls';
import useBlockDisplayInformation from '../components/use-block-display-information';

const STYLE_INHERITANCE_SUPPORT_KEY = '__experimentalStyleInheritance';
const STYLE_INHERIT_INHERITOR_REFERENCE = {};
const IGNORE_OPT_OUT = {};

// --- CSS custom property name constants ---
const COLOR_CSS_VARS = {
	text: '--wp--inherited--color--text',
	background: '--wp--inherited--color--background',
	gradient: '--wp--inherited--color--gradient',
	link: '--wp--inherited--color--link',
};
const TYPOGRAPHY_CSS_VARS = {
	fontSize: '--wp--inherited--typography--font-size',
	fontFamily: '--wp--inherited--typography--font-family',
	fontWeight: '--wp--inherited--typography--font-weight',
	lineHeight: '--wp--inherited--typography--line-height',
	letterSpacing: '--wp--inherited--typography--letter-spacing',
	textTransform: '--wp--inherited--typography--text-transform',
	textDecoration: '--wp--inherited--typography--text-decoration',
};
const SPACING_CSS_VARS = {
	paddingTop: '--wp--inherited--spacing--padding-top',
	paddingRight: '--wp--inherited--spacing--padding-right',
	paddingBottom: '--wp--inherited--spacing--padding-bottom',
	paddingLeft: '--wp--inherited--spacing--padding-left',
	marginTop: '--wp--inherited--spacing--margin-top',
	marginRight: '--wp--inherited--spacing--margin-right',
	marginBottom: '--wp--inherited--spacing--margin-bottom',
	marginLeft: '--wp--inherited--spacing--margin-left',
};
const BORDER_CSS_VARS = {
	color: '--wp--inherited--border--color',
	width: '--wp--inherited--border--width',
	radius: '--wp--inherited--border--radius',
	style: '--wp--inherited--border--style',
};

const GROUP_TO_INSPECTOR_GROUP = {
	color: 'color',
	typography: 'typography',
	spacing: 'dimensions',
	border: 'border',
};

const GROUP_ATTRIBUTE_KEYS = {
	color: [ 'textColor', 'backgroundColor', 'gradient' ],
	typography: [ 'fontSize', 'fontFamily' ],
	spacing: [],
	border: [],
};

const GROUP_STYLE_KEYS = {
	color: [ 'color' ],
	typography: [ 'typography' ],
	spacing: [ 'spacing' ],
	border: [ 'border' ],
};

function hasProviderSupport( blockName ) {
	return !! getBlockSupport( blockName, STYLE_INHERITANCE_SUPPORT_KEY )
		?.provides?.length;
}

function hasInheritorSupport( blockName ) {
	return !! getBlockSupport( blockName, STYLE_INHERITANCE_SUPPORT_KEY )
		?.inherits?.length;
}

/**
 * Returns a map of CSS custom property names → values for the given style
 * groups and block attributes. Only includes properties the block has set.
 *
 * @param {string[]} provides   Groups this block provides.
 * @param {Object}   attributes Block attributes.
 * @return {Object} CSS var name → value.
 */
export function buildProviderStyleVars( provides, attributes ) {
	const vars = {};
	const {
		textColor,
		backgroundColor,
		gradient,
		fontSize,
		fontFamily,
		style,
	} = attributes;

	if ( provides.includes( 'color' ) ) {
		if ( textColor ) {
			vars[
				COLOR_CSS_VARS.text
			] = `var(--wp--preset--color--${ textColor })`;
		} else if ( style?.color?.text ) {
			vars[ COLOR_CSS_VARS.text ] = style.color.text;
		}

		if ( backgroundColor ) {
			vars[
				COLOR_CSS_VARS.background
			] = `var(--wp--preset--color--${ backgroundColor })`;
		} else if ( style?.color?.background ) {
			vars[ COLOR_CSS_VARS.background ] = style.color.background;
		}

		if ( gradient ) {
			vars[
				COLOR_CSS_VARS.gradient
			] = `var(--wp--preset--gradient--${ gradient })`;
		} else if ( style?.color?.gradient ) {
			vars[ COLOR_CSS_VARS.gradient ] = style.color.gradient;
		}

		if ( style?.elements?.link?.color?.text ) {
			vars[ COLOR_CSS_VARS.link ] = style.elements.link.color.text;
		}
	}

	if ( provides.includes( 'typography' ) ) {
		if ( fontSize ) {
			vars[
				TYPOGRAPHY_CSS_VARS.fontSize
			] = `var(--wp--preset--font-size--${ fontSize })`;
		} else if ( style?.typography?.fontSize ) {
			vars[ TYPOGRAPHY_CSS_VARS.fontSize ] = style.typography.fontSize;
		}

		if ( fontFamily ) {
			vars[
				TYPOGRAPHY_CSS_VARS.fontFamily
			] = `var(--wp--preset--font-family--${ fontFamily })`;
		} else if ( style?.typography?.fontFamily ) {
			vars[ TYPOGRAPHY_CSS_VARS.fontFamily ] =
				style.typography.fontFamily;
		}

		if ( style?.typography?.fontWeight ) {
			vars[ TYPOGRAPHY_CSS_VARS.fontWeight ] =
				style.typography.fontWeight;
		}
		if ( style?.typography?.lineHeight ) {
			vars[ TYPOGRAPHY_CSS_VARS.lineHeight ] =
				style.typography.lineHeight;
		}
		if ( style?.typography?.letterSpacing ) {
			vars[ TYPOGRAPHY_CSS_VARS.letterSpacing ] =
				style.typography.letterSpacing;
		}
		if ( style?.typography?.textTransform ) {
			vars[ TYPOGRAPHY_CSS_VARS.textTransform ] =
				style.typography.textTransform;
		}
		if ( style?.typography?.textDecoration ) {
			vars[ TYPOGRAPHY_CSS_VARS.textDecoration ] =
				style.typography.textDecoration;
		}
	}

	if ( provides.includes( 'spacing' ) ) {
		const padding = style?.spacing?.padding;
		if ( padding ) {
			if ( padding.top ) {
				vars[ SPACING_CSS_VARS.paddingTop ] = padding.top;
			}
			if ( padding.right ) {
				vars[ SPACING_CSS_VARS.paddingRight ] = padding.right;
			}
			if ( padding.bottom ) {
				vars[ SPACING_CSS_VARS.paddingBottom ] = padding.bottom;
			}
			if ( padding.left ) {
				vars[ SPACING_CSS_VARS.paddingLeft ] = padding.left;
			}
		}
		const margin = style?.spacing?.margin;
		if ( margin ) {
			if ( margin.top ) {
				vars[ SPACING_CSS_VARS.marginTop ] = margin.top;
			}
			if ( margin.right ) {
				vars[ SPACING_CSS_VARS.marginRight ] = margin.right;
			}
			if ( margin.bottom ) {
				vars[ SPACING_CSS_VARS.marginBottom ] = margin.bottom;
			}
			if ( margin.left ) {
				vars[ SPACING_CSS_VARS.marginLeft ] = margin.left;
			}
		}
	}

	if ( provides.includes( 'border' ) ) {
		if ( style?.border?.color ) {
			vars[ BORDER_CSS_VARS.color ] = style.border.color;
		}
		if ( style?.border?.width ) {
			vars[ BORDER_CSS_VARS.width ] = style.border.width;
		}
		if ( style?.border?.radius ) {
			vars[ BORDER_CSS_VARS.radius ] = style.border.radius;
		}
		if ( style?.border?.style ) {
			vars[ BORDER_CSS_VARS.style ] = style.border.style;
		}
	}

	return vars;
}

/**
 * Generates a scoped CSS block for an inheritor element.
 *
 * - Naturally-inheriting CSS properties (color, font-*) get `inherit !important`
 *   so they override any inline style and rely on the CSS cascade from the provider.
 * - Non-inheriting properties (background, padding, border) get an explicit
 *   `var(--wp--inherited--...)` reference so they pick up the provider's CSS var.
 *
 * @param {string}   selector     CSS selector for the inheritor wrapper.
 * @param {string[]} activeGroups Groups that are active (not opted out and have a provider).
 * @param {Object}   parentVars   Merged CSS var map from all nearest ancestor providers.
 * @return {string} CSS string, or empty string if no rules apply.
 */
export function buildInheritorCSS( selector, activeGroups, parentVars ) {
	const rules = [];

	if ( activeGroups.includes( 'color' ) ) {
		if ( parentVars[ COLOR_CSS_VARS.text ] ) {
			rules.push( 'color: inherit !important;' );
		}
		if ( parentVars[ COLOR_CSS_VARS.background ] ) {
			rules.push(
				`background-color: var(${ COLOR_CSS_VARS.background }) !important;`
			);
		}
		if ( parentVars[ COLOR_CSS_VARS.gradient ] ) {
			rules.push(
				`background: var(${ COLOR_CSS_VARS.gradient }) !important;`
			);
		}
	}

	if ( activeGroups.includes( 'typography' ) ) {
		if ( parentVars[ TYPOGRAPHY_CSS_VARS.fontSize ] ) {
			rules.push( 'font-size: inherit !important;' );
		}
		if ( parentVars[ TYPOGRAPHY_CSS_VARS.fontFamily ] ) {
			rules.push( 'font-family: inherit !important;' );
		}
		if ( parentVars[ TYPOGRAPHY_CSS_VARS.fontWeight ] ) {
			rules.push( 'font-weight: inherit !important;' );
		}
		if ( parentVars[ TYPOGRAPHY_CSS_VARS.lineHeight ] ) {
			rules.push( 'line-height: inherit !important;' );
		}
		if ( parentVars[ TYPOGRAPHY_CSS_VARS.letterSpacing ] ) {
			rules.push( 'letter-spacing: inherit !important;' );
		}
		if ( parentVars[ TYPOGRAPHY_CSS_VARS.textTransform ] ) {
			rules.push( 'text-transform: inherit !important;' );
		}
		if ( parentVars[ TYPOGRAPHY_CSS_VARS.textDecoration ] ) {
			rules.push( 'text-decoration: inherit !important;' );
		}
	}

	if ( activeGroups.includes( 'spacing' ) ) {
		if ( parentVars[ SPACING_CSS_VARS.paddingTop ] ) {
			rules.push(
				`padding-top: var(${ SPACING_CSS_VARS.paddingTop }) !important;`
			);
		}
		if ( parentVars[ SPACING_CSS_VARS.paddingRight ] ) {
			rules.push(
				`padding-right: var(${ SPACING_CSS_VARS.paddingRight }) !important;`
			);
		}
		if ( parentVars[ SPACING_CSS_VARS.paddingBottom ] ) {
			rules.push(
				`padding-bottom: var(${ SPACING_CSS_VARS.paddingBottom }) !important;`
			);
		}
		if ( parentVars[ SPACING_CSS_VARS.paddingLeft ] ) {
			rules.push(
				`padding-left: var(${ SPACING_CSS_VARS.paddingLeft }) !important;`
			);
		}
		if ( parentVars[ SPACING_CSS_VARS.marginTop ] ) {
			rules.push(
				`margin-top: var(${ SPACING_CSS_VARS.marginTop }) !important;`
			);
		}
		if ( parentVars[ SPACING_CSS_VARS.marginRight ] ) {
			rules.push(
				`margin-right: var(${ SPACING_CSS_VARS.marginRight }) !important;`
			);
		}
		if ( parentVars[ SPACING_CSS_VARS.marginBottom ] ) {
			rules.push(
				`margin-bottom: var(${ SPACING_CSS_VARS.marginBottom }) !important;`
			);
		}
		if ( parentVars[ SPACING_CSS_VARS.marginLeft ] ) {
			rules.push(
				`margin-left: var(${ SPACING_CSS_VARS.marginLeft }) !important;`
			);
		}
	}

	if ( activeGroups.includes( 'border' ) ) {
		if ( parentVars[ BORDER_CSS_VARS.color ] ) {
			rules.push(
				`border-color: var(${ BORDER_CSS_VARS.color }) !important;`
			);
		}
		if ( parentVars[ BORDER_CSS_VARS.width ] ) {
			rules.push(
				`border-width: var(${ BORDER_CSS_VARS.width }) !important;`
			);
		}
		if ( parentVars[ BORDER_CSS_VARS.radius ] ) {
			rules.push(
				`border-radius: var(${ BORDER_CSS_VARS.radius }) !important;`
			);
		}
		if ( parentVars[ BORDER_CSS_VARS.style ] ) {
			rules.push(
				`border-style: var(${ BORDER_CSS_VARS.style }) !important;`
			);
		}
	}

	if ( ! rules.length ) {
		return '';
	}

	return `${ selector } {\n${ rules.join( '\n' ) }\n}`;
}

/**
 * Extends inheritor block settings to include a `styleInheritanceOptOut`
 * attribute. This attribute is a map of group → boolean. When a group is `true`
 * the block opts out of inheriting that group's styles and uses its own settings.
 *
 * @param {Object} settings Block settings.
 * @return {Object} Filtered settings.
 */
function addAttributes( settings ) {
	if ( ! hasInheritorSupport( settings.name ) ) {
		return settings;
	}

	if ( ! settings.attributes.styleInheritanceOptOut ) {
		Object.assign( settings.attributes, {
			styleInheritanceOptOut: {
				type: 'object',
				default: {},
			},
		} );
	}

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/style-inheritance/add-attributes',
	addAttributes
);

/**
 * For each style group the current block inherits, walks the ancestor chain
 * (nearest first) to find the closest block that provides that group.
 *
 * @param {string} clientId               Current block's client ID.
 * @param {string} name                   Current block's name.
 * @param {Object} styleInheritanceOptOut Map of group to boolean (opt-out state).
 * @param {Object} [optOutOverride]       Pass {} to ignore opt-out status.
 * @return {Object} Map of group to provider info and CSS vars.
 */
function useNearestProvidersByGroup(
	clientId,
	name,
	styleInheritanceOptOut,
	optOutOverride = undefined
) {
	return useSelect(
		( select ) => {
			const inherits =
				getBlockSupport( name, STYLE_INHERITANCE_SUPPORT_KEY )
					?.inherits ?? [];
			const optOut = optOutOverride ?? styleInheritanceOptOut ?? {};

			const { getBlockParents, getBlockName, getBlockAttributes } =
				select( blockEditorStore );

			const parents = getBlockParents( clientId, /* ascending */ true );
			const result = {};

			for ( const group of inherits ) {
				if ( optOut[ group ] ) {
					continue;
				}

				for ( const parentId of parents ) {
					const parentName = getBlockName( parentId );
					const provides =
						getBlockSupport(
							parentName,
							STYLE_INHERITANCE_SUPPORT_KEY
						)?.provides ?? [];

					if ( provides.includes( group ) ) {
						const parentAttrs = getBlockAttributes( parentId );
						result[ group ] = {
							providerClientId: parentId,
							providerName: parentName,
							styleVars: buildProviderStyleVars(
								[ group ],
								parentAttrs
							),
						};
						break;
					}
				}
			}

			return result;
		},
		[ clientId, name, styleInheritanceOptOut, optOutOverride ]
	);
}

function useProviderBlockProps( {
	name,
	textColor,
	backgroundColor,
	gradient,
	fontSize,
	fontFamily,
	style,
} ) {
	const provides =
		getBlockSupport( name, STYLE_INHERITANCE_SUPPORT_KEY )?.provides ?? [];

	const styleVars = buildProviderStyleVars( provides, {
		textColor,
		backgroundColor,
		gradient,
		fontSize,
		fontFamily,
		style,
	} );

	if ( ! Object.keys( styleVars ).length ) {
		return {};
	}

	return { style: styleVars };
}

function useInheritorBlockProps( { name, clientId, styleInheritanceOptOut } ) {
	const id = useInstanceId( STYLE_INHERIT_INHERITOR_REFERENCE );
	const selector = `.wp-style-inherit-${ id }`;

	const providersByGroup = useNearestProvidersByGroup(
		clientId,
		name,
		styleInheritanceOptOut
	);

	const activeGroups = Object.keys( providersByGroup );

	const allParentVars = activeGroups.reduce( ( acc, group ) => {
		return { ...acc, ...providersByGroup[ group ].styleVars };
	}, {} );

	const css = buildInheritorCSS( selector, activeGroups, allParentVars );

	useStyleOverride( { css } );

	return css ? { className: `wp-style-inherit-${ id }` } : {};
}

function StyleInheritanceGroupControl( {
	group,
	providerClientId,
	childClientId,
	isOptedOut,
	optOut,
	setAttributes,
} ) {
	const inspectorGroup = GROUP_TO_INSPECTOR_GROUP[ group ] ?? 'color';
	const providerInfo = useBlockDisplayInformation( providerClientId );
	const providerTitle = providerInfo?.title ?? __( 'parent block' );

	const { providerAttributes, childStyle } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			const childAttrs = getBlockAttributes( childClientId );
			return {
				providerAttributes: ! isOptedOut
					? getBlockAttributes( providerClientId )
					: null,
				childStyle: childAttrs?.style ?? {},
			};
		},
		[ providerClientId, childClientId, isOptedOut ]
	);

	function handleOverride() {
		if ( ! providerAttributes ) {
			return;
		}

		const changes = {};

		// Copy the group's top-level attribute keys from the provider.
		for ( const key of GROUP_ATTRIBUTE_KEYS[ group ] ?? [] ) {
			changes[ key ] = providerAttributes[ key ];
		}

		// Merge the group's style sub-object from the provider.
		const mergedStyle = { ...childStyle };
		for ( const styleKey of GROUP_STYLE_KEYS[ group ] ?? [] ) {
			if ( providerAttributes.style?.[ styleKey ] !== undefined ) {
				mergedStyle[ styleKey ] = providerAttributes.style[ styleKey ];
			}
		}
		changes.style = cleanEmptyObject( mergedStyle );
		changes.styleInheritanceOptOut = { ...optOut, [ group ]: true };

		setAttributes( changes );
	}

	function handleReset() {
		const changes = {};

		// Clear the group's top-level attribute keys.
		for ( const key of GROUP_ATTRIBUTE_KEYS[ group ] ?? [] ) {
			changes[ key ] = undefined;
		}

		// Clear the group's style sub-keys.
		const nextStyle = { ...childStyle };
		for ( const styleKey of GROUP_STYLE_KEYS[ group ] ?? [] ) {
			delete nextStyle[ styleKey ];
		}
		changes.style = cleanEmptyObject( nextStyle );
		changes.styleInheritanceOptOut = { ...optOut, [ group ]: false };

		setAttributes( changes );
	}

	if ( isOptedOut ) {
		return (
			<InspectorControls group={ inspectorGroup }>
				<Button variant="link" onClick={ handleReset }>
					{ __( 'Reset to Inherited' ) }
				</Button>
			</InspectorControls>
		);
	}

	return (
		<InspectorControls group={ inspectorGroup }>
			<Notice isDismissible={ false } status="info">
				<span style={ { whiteSpace: 'nowrap' } }>
					{ sprintf(
						/* translators: %s: parent block title */
						__( 'Inherited from %s' ),
						providerTitle
					) }
				</span>
				<br />
				<Button variant="link" onClick={ handleOverride }>
					{ __( 'Override' ) }
				</Button>
			</Notice>
		</InspectorControls>
	);
}

function StyleInheritanceEdit( {
	name,
	clientId,
	setAttributes,
	styleInheritanceOptOut,
} ) {
	const optOut = styleInheritanceOptOut ?? {};

	// Find providers for ALL inherited groups (ignoring opt-out) so the
	// Inspector UI can show status even for opted-out groups.
	const providersByGroup = useNearestProvidersByGroup(
		clientId,
		name,
		styleInheritanceOptOut,
		IGNORE_OPT_OUT
	);

	const inherits =
		getBlockSupport( name, STYLE_INHERITANCE_SUPPORT_KEY )?.inherits ?? [];

	return inherits.map( ( group ) => {
		const provider = providersByGroup[ group ];
		if ( ! provider ) {
			return null;
		}

		return (
			<StyleInheritanceGroupControl
				key={ group }
				group={ group }
				providerClientId={ provider.providerClientId }
				childClientId={ clientId }
				isOptedOut={ !! optOut[ group ] }
				optOut={ optOut }
				setAttributes={ setAttributes }
			/>
		);
	} );
}

/**
 * Adds CSS custom property inline styles to the provider block's saved HTML so
 * the vars cascade to descendant inheritor blocks on the frontend.
 *
 * @param {Object} props      Accumulated save props.
 * @param {string} name       Block name.
 * @param {Object} attributes Block attributes (only the needed subset).
 * @return {Object} Updated save props.
 */
function addProviderSaveProps( props, name, attributes ) {
	const provides =
		getBlockSupport( name, STYLE_INHERITANCE_SUPPORT_KEY )?.provides ?? [];

	const styleVars = buildProviderStyleVars( provides, attributes );

	if ( ! Object.keys( styleVars ).length ) {
		return props;
	}

	return {
		...props,
		style: {
			...props.style,
			...styleVars,
		},
	};
}

export const styleInheritanceProvider = {
	hasSupport: hasProviderSupport,
	attributeKeys: [
		'textColor',
		'backgroundColor',
		'gradient',
		'fontSize',
		'fontFamily',
		'style',
	],
	useBlockProps: useProviderBlockProps,
	addSaveProps: addProviderSaveProps,
};

export const styleInheritanceInheritor = {
	hasSupport: hasInheritorSupport,
	attributeKeys: [ 'styleInheritanceOptOut' ],
	isMatch: () => true,
	useBlockProps: useInheritorBlockProps,
	edit: StyleInheritanceEdit,
	// TODO: Add addSaveProps that emits var() rules for non-naturally-inheriting
	// properties (background, padding, border) on the frontend. Currently
	// only naturally-inheriting CSS properties (color, font) cascade
	// automatically via the provider's inline CSS vars.
};

export default {
	provider: styleInheritanceProvider,
	inheritor: styleInheritanceInheritor,
};
