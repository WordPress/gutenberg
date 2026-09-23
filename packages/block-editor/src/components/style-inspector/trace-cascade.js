import { compareSpecificity, getMatchingSpecificity } from './specificity';
import { compactValues } from './properties';

/**
 * Traces the CSS cascade for a canvas element the way a browser's element
 * inspector does: read every stylesheet the canvas document has, keep the
 * rules that match the element and declare a property, and order them by the
 * cascade. For inherited properties with nothing declared on the element, the
 * same is done for each ancestor.
 *
 * This is deliberately on demand. It walks every rule in the canvas, which is
 * cheap enough for one block when asked for, and far too expensive to run for
 * every control on every render.
 *
 * Known approximations, all acceptable for an explanatory tool:
 * - `@container` rules are kept as if they applied, and flagged.
 * - Layer order is approximated by source order; unlayered rules beat
 *   layered ones for normal declarations, and lose for `!important` ones.
 * - Rules nested with CSS nesting are skipped.
 */

const INLINE_SPECIFICITY = [ Infinity, 0, 0 ];

function isStyleRule( rule ) {
	return typeof rule.selectorText === 'string' && !! rule.style;
}

function isImportRule( rule ) {
	return !! rule.styleSheet && typeof rule.href === 'string';
}

function isMediaRule( rule ) {
	return !! rule.media && !! rule.cssRules && ! isImportRule( rule );
}

// `@supports` and `@container` both expose `conditionText`.
function isConditionRule( rule ) {
	return typeof rule.conditionText === 'string' && !! rule.cssRules;
}

function isContainerRule( rule ) {
	return isConditionRule( rule ) && 'containerName' in rule;
}

function isLayerBlockRule( rule ) {
	return (
		typeof rule.name === 'string' &&
		!! rule.cssRules &&
		! isStyleRule( rule ) &&
		! isConditionRule( rule )
	);
}

function readRules( sheet ) {
	try {
		return sheet.cssRules;
	} catch {
		// Cross-origin stylesheets cannot be read.
		return null;
	}
}

/**
 * Flattens every style rule that currently applies in a document, keeping the
 * context the cascade needs: source order, the stylesheet, and whether the
 * rule sits in a cascade layer or behind a condition that was not evaluated.
 *
 * @param {Document} doc Canvas document.
 * @return {{ rules: Object[], unreadableSheets: number }} Flattened rules.
 */
export function collectStyleRules( doc ) {
	const view = doc.defaultView;
	const rules = [];
	let unreadableSheets = 0;

	function walk( ruleList, sheet, context ) {
		for ( const rule of ruleList ) {
			if ( isStyleRule( rule ) ) {
				rules.push( {
					rule,
					sheet,
					order: rules.length,
					layered: context.layered,
					conditional: context.conditional,
				} );
			} else if ( isImportRule( rule ) ) {
				const mediaText = rule.media?.mediaText;
				if ( mediaText && ! view.matchMedia( mediaText ).matches ) {
					continue;
				}
				const imported = readRules( rule.styleSheet );
				if ( imported ) {
					walk( imported, rule.styleSheet, context );
				} else {
					unreadableSheets++;
				}
			} else if ( isMediaRule( rule ) ) {
				if ( view.matchMedia( rule.media.mediaText ).matches ) {
					walk( rule.cssRules, sheet, context );
				}
			} else if ( isContainerRule( rule ) ) {
				walk( rule.cssRules, sheet, {
					...context,
					conditional: true,
				} );
			} else if ( isConditionRule( rule ) ) {
				if ( view.CSS.supports( rule.conditionText ) ) {
					walk( rule.cssRules, sheet, context );
				}
			} else if ( isLayerBlockRule( rule ) ) {
				walk( rule.cssRules, sheet, { ...context, layered: true } );
			}
		}
	}

	const sheets = [
		...Array.from( doc.styleSheets ),
		...( doc.adoptedStyleSheets ?? [] ),
	];
	for ( const sheet of sheets ) {
		if ( sheet.disabled ) {
			continue;
		}
		const mediaText = sheet.media?.mediaText;
		if ( mediaText && ! view.matchMedia( mediaText ).matches ) {
			continue;
		}
		const ruleList = readRules( sheet );
		if ( ! ruleList ) {
			unreadableSheets++;
			continue;
		}
		walk( ruleList, sheet, { layered: false, conditional: false } );
	}
	return { rules, unreadableSheets };
}

/**
 * Positive when declaration `a` wins over `b` in the cascade.
 *
 * @param {Object} a Declaration.
 * @param {Object} b Declaration.
 * @return {number} Comparison result.
 */
export function compareDeclarations( a, b ) {
	if ( a.important !== b.important ) {
		return a.important ? 1 : -1;
	}
	if ( a.inline !== b.inline ) {
		return a.inline ? 1 : -1;
	}
	if ( a.layered !== b.layered ) {
		// Unlayered wins for normal declarations; layered for `!important`.
		return a.layered === a.important ? 1 : -1;
	}
	const bySpecificity = compareSpecificity( a.specificity, b.specificity );
	if ( bySpecificity !== 0 ) {
		return bySpecificity;
	}
	return a.order - b.order;
}

function getDeclaredValue( style, property ) {
	const declared = property.longhands
		.map( ( longhand ) => [ longhand, style.getPropertyValue( longhand ) ] )
		.filter( ( [ , value ] ) => value !== '' );
	if ( declared.length === property.longhands.length ) {
		const shorthandValue = property.shorthand
			? style.getPropertyValue( property.shorthand )
			: '';
		return (
			shorthandValue ||
			compactValues( declared.map( ( [ , value ] ) => value ) )
		);
	}
	return declared
		.map( ( [ longhand, value ] ) => `${ longhand }: ${ value }` )
		.join( '; ' );
}

// Every declaration of `property` that applies to `element`, strongest first.
function getElementDeclarations( element, property, matchedRules ) {
	const declarations = [];
	for ( const matched of matchedRules ) {
		const { style } = matched.rule;
		const longhands = property.longhands.filter(
			( longhand ) => style.getPropertyValue( longhand ) !== ''
		);
		if ( ! longhands.length ) {
			continue;
		}
		declarations.push( {
			value: getDeclaredValue( style, property ),
			longhands,
			important: longhands.some(
				( longhand ) =>
					style.getPropertyPriority( longhand ) === 'important'
			),
			inline: false,
			layered: matched.layered,
			conditional: matched.conditional,
			specificity: matched.specificity,
			order: matched.order,
			selectorText: matched.rule.selectorText,
			sheet: matched.sheet,
		} );
	}

	const inlineStyle = element.style;
	const inlineLonghands = property.longhands.filter(
		( longhand ) =>
			!! inlineStyle && inlineStyle.getPropertyValue( longhand ) !== ''
	);
	if ( inlineLonghands.length ) {
		declarations.push( {
			value: getDeclaredValue( inlineStyle, property ),
			longhands: inlineLonghands,
			important: inlineLonghands.some(
				( longhand ) =>
					inlineStyle.getPropertyPriority( longhand ) === 'important'
			),
			inline: true,
			layered: false,
			conditional: false,
			specificity: INLINE_SPECIFICITY,
			order: Infinity,
			selectorText: null,
			sheet: null,
		} );
	}

	declarations.sort( ( a, b ) => compareDeclarations( b, a ) );

	// A declaration is in effect when it is the strongest for at least one
	// of the longhands it sets.
	const decided = new Set();
	for ( const declaration of declarations ) {
		const wins = declaration.longhands.filter(
			( longhand ) => ! decided.has( longhand )
		);
		wins.forEach( ( longhand ) => decided.add( longhand ) );
		declaration.isInEffect = wins.length > 0;
	}
	return declarations;
}

/**
 * Keeps the rules that match an element, with the specificity they match at.
 * Rules are pre-filtered to the ones that declare a traced longhand, so
 * `Element.matches` runs on a fraction of the stylesheet.
 *
 * @param {Element}  element Element.
 * @param {Object[]} rules   Candidate rules.
 * @return {Object[]} Matching rules.
 */
function matchRules( element, rules ) {
	const matched = [];
	for ( const candidate of rules ) {
		const specificity = getMatchingSpecificity(
			element,
			candidate.rule.selectorText
		);
		if ( specificity ) {
			matched.push( { ...candidate, specificity } );
		}
	}
	return matched;
}

/**
 * Traces where each property's value comes from.
 *
 * @param {Element}  element    Block element in the canvas.
 * @param {Object[]} properties Properties from `getInspectorGroups`.
 * @return {Object} `{ results, stats }`, where `results` maps each property's
 * first longhand to `{ declarations, inherited }`, and `inherited` lists the
 * ancestors that declare an inherited property, nearest first.
 */
export function traceCascade( element, properties ) {
	const startedAt = element.ownerDocument.defaultView.performance.now();
	const { rules, unreadableSheets } = collectStyleRules(
		element.ownerDocument
	);

	const tracedLonghands = properties.flatMap(
		( property ) => property.longhands
	);
	const relevantRules = rules.filter( ( { rule } ) =>
		tracedLonghands.some(
			( longhand ) => rule.style.getPropertyValue( longhand ) !== ''
		)
	);

	const matchCache = new Map();
	const getMatched = ( target ) => {
		if ( ! matchCache.has( target ) ) {
			matchCache.set( target, matchRules( target, relevantRules ) );
		}
		return matchCache.get( target );
	};

	const results = {};
	for ( const property of properties ) {
		const declarations = getElementDeclarations(
			element,
			property,
			getMatched( element )
		);
		const inherited = [];
		if ( property.inherits && ! declarations.length ) {
			let isSettled = false;
			for (
				let ancestor = element.parentElement;
				ancestor;
				ancestor = ancestor.parentElement
			) {
				const ancestorDeclarations = getElementDeclarations(
					ancestor,
					property,
					getMatched( ancestor )
				);
				if ( ! ancestorDeclarations.length ) {
					continue;
				}
				// Only the nearest ancestor's winner reaches the element.
				if ( isSettled ) {
					ancestorDeclarations.forEach( ( declaration ) => {
						declaration.isInEffect = false;
					} );
				}
				isSettled = true;
				inherited.push( {
					element: ancestor,
					declarations: ancestorDeclarations,
				} );
			}
		}
		results[ property.longhands[ 0 ] ] = { declarations, inherited };
	}

	return {
		results,
		stats: {
			ruleCount: rules.length,
			matchedElementCount: matchCache.size,
			unreadableSheets,
			duration:
				element.ownerDocument.defaultView.performance.now() - startedAt,
		},
	};
}

/**
 * Resolves a value's top-level `var()` references against an element, so a
 * preset reference can be shown next to what it paints.
 *
 * @param {Element} element Element whose custom properties apply.
 * @param {string}  value   Declared value.
 * @return {?string} Resolved value, or `null` when there is nothing to resolve.
 */
export function resolveCustomProperties( element, value ) {
	if ( ! value || ! value.includes( 'var(' ) ) {
		return null;
	}
	const computed =
		element.ownerDocument.defaultView.getComputedStyle( element );
	let resolved = value;
	// Resolve innermost references first, a few levels deep.
	for ( let depth = 0; depth < 5 && resolved.includes( 'var(' ); depth++ ) {
		resolved = resolved.replace(
			/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g,
			( match, name, fallback ) =>
				computed.getPropertyValue( name ).trim() ||
				fallback?.trim() ||
				match
		);
	}
	return resolved === value ? null : resolved;
}

/**
 * Every other property any stylesheet or inline style sets on the element,
 * beyond the ones `traceCascade` was asked about. This is the catch-all for
 * CSS that no inspector setting knows about, such as an `opacity` written in
 * Global CSS. It tests every rule in the canvas against the element, so it
 * only runs when someone asks to see everything.
 *
 * Only the element's own declarations are traced; inherited values of these
 * properties are not followed up to ancestors.
 *
 * @param {Element}  element        Block element in the canvas.
 * @param {string[]} knownLonghands Longhands already covered elsewhere.
 * @return {Object[]} `{ property, declarations }` per property, by name.
 */
export function traceOtherProperties( element, knownLonghands ) {
	const known = new Set( knownLonghands );
	const { rules } = collectStyleRules( element.ownerDocument );
	const byProperty = new Map();

	function collect( style, context ) {
		for ( let index = 0; index < style.length; index++ ) {
			const name = style[ index ];
			const value = style.getPropertyValue( name );
			// Custom properties are plumbing, and `initial` is what a
			// shorthand leaves on the longhands it does not mention.
			if (
				name.startsWith( '--' ) ||
				known.has( name ) ||
				! value ||
				value === 'initial'
			) {
				continue;
			}
			if ( ! byProperty.has( name ) ) {
				byProperty.set( name, [] );
			}
			byProperty.get( name ).push( {
				...context,
				value,
				longhands: [ name ],
				important: style.getPropertyPriority( name ) === 'important',
			} );
		}
	}

	for ( const matched of matchRules( element, rules ) ) {
		collect( matched.rule.style, {
			inline: false,
			layered: matched.layered,
			conditional: matched.conditional,
			specificity: matched.specificity,
			order: matched.order,
			selectorText: matched.rule.selectorText,
			sheet: matched.sheet,
		} );
	}
	if ( element.style ) {
		collect( element.style, {
			inline: true,
			layered: false,
			conditional: false,
			specificity: INLINE_SPECIFICITY,
			order: Infinity,
			selectorText: null,
			sheet: null,
		} );
	}

	return [ ...byProperty.entries() ]
		.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) )
		.map( ( [ property, declarations ] ) => {
			declarations.sort( ( a, b ) => compareDeclarations( b, a ) );
			declarations.forEach( ( declaration, index ) => {
				declaration.isInEffect = index === 0;
			} );
			return { property, declarations };
		} );
}
