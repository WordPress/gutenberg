import { __, sprintf } from '@wordpress/i18n';

/**
 * Turns what the cascade tracer found (a stylesheet, a selector, an inline
 * style) into words someone building a site would use: "this block", "site
 * styles", "Group block". The raw selectors and stylesheets stay behind the
 * scenes.
 */

const PRESET_CLASS =
	/^\.has-[\w-]+-(color|background-color|border-color|font-size|font-family|gradient-background)$/;

const ELEMENT_SELECTORS = [
	{
		test: /(^|[\s,(>+~])h([1-6])(?![\w-])/,
		label: ( match ) =>
			sprintf(
				/* translators: %s: heading level, e.g. "H2". */
				__( 'Site styles · %s headings' ),
				`H${ match[ 2 ] }`
			),
	},
	{
		test: /(^|[\s,(>+~])a(?![\w-])|\.wp-element-link/,
		label: () => __( 'Site styles · Links' ),
	},
	{
		test: /\.wp-element-button|(^|[\s,(>+~])button(?![\w-])/,
		label: () => __( 'Site styles · Buttons' ),
	},
	{
		test: /\.wp-element-caption|figcaption/,
		label: () => __( 'Site styles · Captions' ),
	},
	{
		test: /(^|[\s,(>+~])cite(?![\w-])/,
		label: () => __( 'Site styles · Citations' ),
	},
];

const ROOT_SELECTOR = /^(:root|html|body|\.editor-styles-wrapper)$/;

// The block type a selector targets, from its `.wp-block-*` class. Inner
// element classes such as `.wp-block-button__link` belong to their block.
function getTargetedBlockClass( selectorText ) {
	return (
		selectorText.match(
			/\.wp-block-([a-z0-9-]+?)(?:__[\w-]+)?(?![\w-])/
		)?.[ 1 ] ?? null
	);
}

function titleCase( slug ) {
	return slug
		.split( '-' )
		.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
		.join( ' ' );
}

/**
 * Names a preset referenced by a value, e.g. `var(--wp--preset--color--accent-4)`
 * or `var:preset|color|accent-4` → "Accent 4".
 *
 * @param {string}   value         CSS or theme.json value.
 * @param {Function} getPresetName Looks up a preset's name by type and slug.
 * @return {?string} Preset name, or `null` when the value is not a preset.
 */
export function getPresetLabel( value, getPresetName ) {
	if ( typeof value !== 'string' ) {
		return null;
	}
	const match =
		value.match( /--wp--preset--([\w]+(?:-[a-z]+)*?)--([\w-]+)\)/ ) ??
		value.match( /^var:preset\|([\w-]+)\|([\w-]+)$/ );
	if ( ! match ) {
		return null;
	}
	return getPresetName( match[ 1 ], match[ 2 ] ) ?? titleCase( match[ 2 ] );
}

/**
 * Describes one declaration found by the tracer.
 *
 * @param {Object}   declaration           Declaration from `traceCascade`.
 * @param {Object}   context
 * @param {Element}  context.owner         Element the declaration applies to.
 * @param {Element}  context.inspected     Element being inspected.
 * @param {Function} context.getBlockTitle Title for a client ID.
 * @param {Function} context.getTypeTitle  Block type title from a `wp-block-*` class.
 * @param {Function} context.getStyleLabel Block style variation label from its name.
 * @return {{ kind: string, label: string, isGlobalStyles?: boolean }} Description.
 */
export function describeDeclaration( declaration, context ) {
	const { owner, inspected, getBlockTitle, getTypeTitle, getStyleLabel } =
		context;
	const ownerBlock = owner.closest( '[data-block]' );
	const isInspectedBlock =
		ownerBlock === inspected?.closest( '[data-block]' );
	const onBlock = () =>
		isInspectedBlock
			? {
					kind: 'block',
					label: __( 'Customized here' ),
				}
			: {
					kind: 'parent',
					label: sprintf(
						/* translators: %s: block title, e.g. "Group". */
						__( '%s block' ),
						getBlockTitle( ownerBlock?.dataset.block )
					),
				};

	if ( declaration.inline ) {
		return onBlock();
	}

	const node = declaration.sheet?.ownerNode;
	const origin = node?.dataset?.styleOrigin;
	const selector = declaration.selectorText ?? '';

	// A preset class such as `.has-accent-4-color` is on the element because
	// the block picked that preset.
	if (
		PRESET_CLASS.test( selector ) &&
		owner.classList.contains( selector.slice( 1 ) )
	) {
		return onBlock();
	}

	switch ( origin ) {
		case 'block-supports': {
			// Per-block rules are keyed by a generated class. A layout rule
			// such as `.wp-container-core-group-is-layout-1 > *` belongs to
			// the parent whose layout it is, not to the child it reaches.
			const generatedClass = selector.match(
				/\.(wp-container-[\w-]+|wp-elements-[\w-]+)/
			)?.[ 1 ];
			const ruleBlock = generatedClass
				? owner.ownerDocument
						.querySelector( `.${ generatedClass }` )
						?.closest( '[data-block]' )
				: null;
			if ( ruleBlock && ruleBlock !== ownerBlock ) {
				return {
					kind: 'parent',
					label: sprintf(
						/* translators: %s: block title, e.g. "Group". */
						__( 'Layout of the %s block' ),
						getBlockTitle( ruleBlock.dataset.block )
					),
				};
			}
			return onBlock();
		}
		case 'block-custom-css':
			return {
				kind: isInspectedBlock ? 'block' : 'parent',
				label: __( 'Block CSS' ),
			};
		case 'block-style-variation':
			return {
				kind: 'global',
				isGlobalStyles: true,
				label: sprintf(
					/* translators: %s: block style name, e.g. "Subtitle". */
					__( '“%s” style' ),
					getStyleLabel( node.dataset.styleVariation )
				),
			};
		case 'global-custom-css':
			return {
				kind: 'global',
				label: __( 'Global CSS' ),
			};
		case 'customizer-css':
			return {
				kind: 'global',
				label: __( 'Global CSS (Customizer)' ),
			};
		case 'theme':
			return {
				kind: 'theme',
				label: __( 'Theme stylesheet' ),
			};
		case 'global-styles':
		case 'global-presets':
			return {
				kind: 'global',
				isGlobalStyles: true,
				label: describeGlobalSelector( selector, {
					getTypeTitle,
					getStyleLabel,
				} ),
			};
		case 'editor':
			return {
				kind: 'builtin',
				label: __( 'Editor defaults' ),
			};
	}

	const id = node?.id ?? '';
	if ( /^wp-(block-library|edit-blocks|block-)/.test( id ) ) {
		const blockClass = getTargetedBlockClass( selector );
		return {
			kind: 'builtin',
			label: blockClass
				? sprintf(
						/* translators: %s: block title, e.g. "Button". */
						__( 'Built into the %s block' ),
						getTypeTitle( blockClass )
					)
				: __( 'Built into WordPress blocks' ),
		};
	}
	if ( id.startsWith( 'wp-' ) ) {
		return {
			kind: 'builtin',
			label: __( 'Editor defaults' ),
		};
	}
	// Unlabelled sheets the editor injects itself, such as layout rules.
	return {
		kind: 'other',
		label: __( 'Editor styles' ),
	};
}

function describeGlobalSelector(
	selectorText,
	{ getTypeTitle, getStyleLabel }
) {
	// Global Styles selectors often wrap the target in `:root :where(…)`.
	const selector = selectorText
		.replace( /:root\s*:where\(\s*([^)]*)\)/g, '$1' )
		.trim();

	const variation = selector.match(
		/\.is-style-([\w-]+?)(?:--[\w]+)?(?![\w-])/
	);
	if ( variation ) {
		return sprintf(
			/* translators: %s: block style name, e.g. "Subtitle". */
			__( '“%s” style' ),
			getStyleLabel( variation[ 1 ] )
		);
	}

	if ( /\.is-layout-|\.wp-site-blocks|has-global-padding/.test( selector ) ) {
		return __( 'Site styles · Layout' );
	}

	const blockClass = getTargetedBlockClass( selector );
	if ( blockClass ) {
		return sprintf(
			/* translators: %s: block title, e.g. "Paragraph". */
			__( 'Site styles · %s' ),
			getTypeTitle( blockClass )
		);
	}

	for ( const element of ELEMENT_SELECTORS ) {
		const match = selector.match( element.test );
		if ( match ) {
			return element.label( match );
		}
	}

	if (
		selector
			.split( ',' )
			.some( ( part ) => ROOT_SELECTOR.test( part.trim() ) )
	) {
		return __( 'Site styles' );
	}
	return __( 'Site styles' );
}
