/**
 * One-shot codemod: rewrite `<Tooltip>` imported from `@wordpress/components`
 * to the compositional `Tooltip` API exported by `@wordpress/ui`.
 *
 * Scope and decisions are documented in the migration plan. Highlights:
 *
 *   - Rewrites only the `Tooltip` specifier from `@wordpress/components`
 *     imports; leaves siblings untouched.
 *   - Adds (or merges into) an `import { Tooltip } from '@wordpress/ui'`.
 *   - For each `<Tooltip>…</Tooltip>` JSX usage:
 *       - bails (and logs) if it has more than one JSX child element;
 *       - bails (and logs) on unsupported props (`shortcut`, `delay`,
 *         `hideOnClick`, `position`, or anything else not in the allow-list);
 *       - hoists `key` to `Tooltip.Root`;
 *       - emits `<Tooltip.Root><Tooltip.Trigger render={ child } />
 *         <Tooltip.Popup className=…>{ text }</Tooltip.Popup></Tooltip.Root>`;
 *       - includes a `<Tooltip.Positioner side=… align=… />` only when the
 *         legacy `placement` is non-default.
 *
 * If *any* `<Tooltip>` usage in a file bails out, the whole file is left
 * untouched (no partial transforms, no import surgery). This avoids the
 * broken intermediate state where some usages have been rewritten to
 * `<Tooltip.Root>` while other unconverted `<Tooltip>` usages still depend
 * on the now-removed `@wordpress/components` import. The bailouts are still
 * logged so the author knows where to finish the migration by hand.
 *
 * Usage:
 *   npx jscodeshift -t tools/codemods/tooltip-components-to-ui.js \
 *       --extensions=js,jsx,ts,tsx --parser=tsx \
 *       packages/<scope>
 */
'use strict';

const ALLOWED_PROPS = new Set( [ 'text', 'placement', 'className', 'key' ] );

const PLACEMENT_TO_SIDE_ALIGN = {
	top: { side: 'top', align: 'center' },
	'top-start': { side: 'top', align: 'start' },
	'top-end': { side: 'top', align: 'end' },
	right: { side: 'right', align: 'center' },
	'right-start': { side: 'right', align: 'start' },
	'right-end': { side: 'right', align: 'end' },
	bottom: { side: 'bottom', align: 'center' },
	'bottom-start': { side: 'bottom', align: 'start' },
	'bottom-end': { side: 'bottom', align: 'end' },
	left: { side: 'left', align: 'center' },
	'left-start': { side: 'left', align: 'start' },
	'left-end': { side: 'left', align: 'end' },
};

module.exports = function transformer( file, api ) {
	const j = api.jscodeshift;
	const root = j( file.source );

	// 1. Find `Tooltip` specifier from `@wordpress/components`.
	const componentsImports = root.find( j.ImportDeclaration, {
		source: { value: '@wordpress/components' },
	} );

	// The legacy `Tooltip` may have been imported under an alias (e.g.
	// `Tooltip as WCTooltip`), so we capture the local name (`sourceName`)
	// for matching JSX usages. The emitted replacement always uses the
	// unaliased `Tooltip` namespace from `@wordpress/ui` (which is what
	// step 6 below imports unconditionally).
	let sourceName = null;
	componentsImports.forEach( ( path ) => {
		const specifiers = path.node.specifiers || [];
		for ( const spec of specifiers ) {
			if (
				spec.type === 'ImportSpecifier' &&
				spec.imported &&
				spec.imported.name === 'Tooltip'
			) {
				sourceName = spec.local ? spec.local.name : 'Tooltip';
			}
		}
	} );

	if ( ! sourceName ) {
		return null;
	}

	const targetName = 'Tooltip';

	// 2. First pass: try to build replacement nodes for every <Tooltip> usage
	// in the file. Collect bailouts (with reason and source location) but
	// do not mutate the AST yet.
	const bailouts = [];
	/** @type {{ path: any, replacement: any }[]} */
	const replacements = [];

	function recordBailout( node, reason ) {
		const loc = node && node.loc && node.loc.start;
		const line = loc ? loc.line : '?';
		bailouts.push( `${ file.path }:${ line } ${ reason }` );
	}

	root.find( j.JSXElement, {
		openingElement: {
			name: { type: 'JSXIdentifier', name: sourceName },
		},
	} ).forEach( ( path ) => {
		const result = buildReplacement( j, path.node, sourceName, targetName );
		if ( result.kind === 'bailout' ) {
			recordBailout( path.node, result.reason );
			return;
		}
		replacements.push( { path, replacement: result.node } );
	} );

	// 3. If any usage bailed out, leave the file completely untouched —
	// partial transforms would break the file by removing the legacy
	// import while bailed-out usages still depend on it (and pulling in
	// `Tooltip` from `@wordpress/ui` would clash with the leftover legacy
	// import that uses the same local name). The bailouts are still logged
	// so the author can finish them by hand.
	if ( replacements.length === 0 ) {
		if ( bailouts.length ) {
			console.warn( bailouts.join( '\n' ) );
		}
		return null;
	}
	if ( bailouts.length ) {
		console.warn( bailouts.join( '\n' ) );
		return null;
	}

	// 4. Apply the replacements collected in pass 1.
	for ( const { path, replacement } of replacements ) {
		j( path ).replaceWith( replacement );
	}

	// 5. Remove the `Tooltip` specifier from `@wordpress/components` imports
	// (and drop the import declaration if nothing else remains).
	componentsImports.forEach( ( path ) => {
		const node = path.node;
		const remaining = ( node.specifiers || [] ).filter( ( spec ) => {
			return ! (
				spec.type === 'ImportSpecifier' &&
				spec.imported &&
				spec.imported.name === 'Tooltip'
			);
		} );
		if ( remaining.length === 0 ) {
			j( path ).remove();
		} else {
			node.specifiers = remaining;
		}
	} );

	// 6. Add (or merge into) the `@wordpress/ui` import.
	//
	// Only merge into an existing `@wordpress/ui` import declaration when it
	// already uses named specifiers (`import { Foo } from '@wordpress/ui'`).
	// A default import (`import UI from …`) or a namespace import
	// (`import * as UI from …`) cannot have a named specifier appended
	// without producing invalid syntax, so in those cases we leave the
	// existing declaration untouched and add a separate
	// `import { Tooltip } from '@wordpress/ui'` instead.
	const uiImports = root.find( j.ImportDeclaration, {
		source: { value: '@wordpress/ui' },
	} );
	const mergeTarget = uiImports.filter( ( path ) => {
		const specifiers = path.node.specifiers || [];
		// Reject empty side-effect imports too: pushing into them is fine
		// syntactically but yields a less readable result; treat them like
		// the no-existing-import case below.
		if ( specifiers.length === 0 ) {
			return false;
		}
		return specifiers.every( ( s ) => s.type === 'ImportSpecifier' );
	} );

	if ( mergeTarget.size() ) {
		const node = mergeTarget.at( 0 ).get( 0 ).node;
		const hasTooltip = ( node.specifiers || [] ).some( ( s ) => {
			return (
				s.type === 'ImportSpecifier' &&
				s.imported &&
				s.imported.name === 'Tooltip'
			);
		} );
		if ( ! hasTooltip ) {
			node.specifiers.push(
				j.importSpecifier( j.identifier( 'Tooltip' ) )
			);
		}
	} else {
		// Insert after the last `import` declaration in the file, or at the
		// very top of the program when no imports exist. Reviewers may want
		// to hand-tidy the result into the appropriate import block.
		const allImports = root.find( j.ImportDeclaration );
		const newImport = j.importDeclaration(
			[ j.importSpecifier( j.identifier( 'Tooltip' ) ) ],
			j.literal( '@wordpress/ui' )
		);
		if ( allImports.size() ) {
			allImports.at( -1 ).insertAfter( newImport );
		} else {
			root.get().node.program.body.unshift( newImport );
		}
	}

	return root.toSource( { quote: 'single' } );
};

/**
 * Validate a single `<Tooltip>` JSX element and, if it is convertible,
 * return the new `<Tooltip.Root>…</Tooltip.Root>` node that should replace
 * it. Otherwise, return a bailout descriptor explaining why.
 *
 * @param {*}      j          jscodeshift API.
 * @param {*}      el         The original `<Tooltip>` JSXElement node.
 * @param {string} sourceName Local name of the legacy `Tooltip` import (used
 *                            to find usages, e.g. `WCTooltip` or `Tooltip`).
 * @param {string} targetName Local name of the new `Tooltip` import from
 *                            `@wordpress/ui` (always `Tooltip` for now).
 *
 * @return {{ kind: 'ok', node: any } | { kind: 'bailout', reason: string }} `ok`
 *         with the replacement node, or `bailout` with a human-readable reason.
 */
function buildReplacement( j, el, sourceName, targetName ) {
	const attrs = el.openingElement.attributes || [];
	const propMap = {};

	for ( const attr of attrs ) {
		if ( attr.type !== 'JSXAttribute' ) {
			return {
				kind: 'bailout',
				reason: `bailout: spread attribute on <${ sourceName }>`,
			};
		}
		const name = attr.name && attr.name.name;
		if ( ! ALLOWED_PROPS.has( name ) ) {
			return {
				kind: 'bailout',
				reason: `bailout: unsupported prop \`${ name }\` on <${ sourceName }>`,
			};
		}
		propMap[ name ] = attr.value;
	}

	// Validate children: exactly one JSX child (element or expression).
	const childNodes = ( el.children || [] ).filter( ( c ) => {
		if ( c.type === 'JSXText' ) {
			return c.value.trim() !== '';
		}
		if (
			c.type === 'JSXExpressionContainer' &&
			c.expression.type === 'JSXEmptyExpression'
		) {
			return false;
		}
		return true;
	} );
	if ( childNodes.length !== 1 ) {
		return {
			kind: 'bailout',
			reason: `bailout: expected exactly one child, got ${ childNodes.length }`,
		};
	}

	const child = childNodes[ 0 ];
	let triggerRenderArg = null;
	if ( child.type === 'JSXElement' ) {
		triggerRenderArg = child;
	} else if ( child.type === 'JSXExpressionContainer' ) {
		triggerRenderArg = child.expression;
	} else if ( child.type === 'JSXFragment' ) {
		return { kind: 'bailout', reason: `bailout: child is a JSX fragment` };
	} else {
		return {
			kind: 'bailout',
			reason: `bailout: child has unexpected type ${ child.type }`,
		};
	}

	// `text` must be present (otherwise the legacy tooltip wouldn't render).
	const textValue = propMap.text;
	if ( ! textValue ) {
		return {
			kind: 'bailout',
			reason: `bailout: <${ sourceName }> without \`text\``,
		};
	}

	// Compute the textual content of the Popup. Accept string literal or
	// JSX expression container.
	let popupChild;
	if ( textValue.type === 'StringLiteral' || textValue.type === 'Literal' ) {
		popupChild = j.jsxText( textValue.value );
	} else if ( textValue.type === 'JSXExpressionContainer' ) {
		popupChild = textValue;
	} else {
		return {
			kind: 'bailout',
			reason: `bailout: unrecognized \`text\` attribute value type ${ textValue.type }`,
		};
	}

	// Compute placement → positioner.
	let positionerAttr = null;
	const placementAttr = propMap.placement;
	if ( placementAttr ) {
		let placement = null;
		if (
			placementAttr.type === 'StringLiteral' ||
			placementAttr.type === 'Literal'
		) {
			placement = placementAttr.value;
		} else if ( placementAttr.type === 'JSXExpressionContainer' ) {
			// Only inline literal expressions like {'top'} are supported.
			const expr = placementAttr.expression;
			if ( expr.type === 'StringLiteral' || expr.type === 'Literal' ) {
				placement = expr.value;
			} else {
				return {
					kind: 'bailout',
					reason: `bailout: dynamic \`placement\` value not statically resolvable`,
				};
			}
		}
		if ( placement && placement !== 'top' ) {
			const mapping = PLACEMENT_TO_SIDE_ALIGN[ placement ];
			if ( ! mapping ) {
				return {
					kind: 'bailout',
					reason: `bailout: unknown placement \`${ placement }\``,
				};
			}
			const sideAttr = j.jsxAttribute(
				j.jsxIdentifier( 'side' ),
				j.stringLiteral( mapping.side )
			);
			const positionerAttrs = [ sideAttr ];
			if ( mapping.align !== 'center' ) {
				positionerAttrs.push(
					j.jsxAttribute(
						j.jsxIdentifier( 'align' ),
						j.stringLiteral( mapping.align )
					)
				);
			}
			positionerAttr = j.jsxAttribute(
				j.jsxIdentifier( 'positioner' ),
				j.jsxExpressionContainer(
					j.jsxElement(
						j.jsxOpeningElement(
							j.jsxMemberExpression(
								j.jsxIdentifier( targetName ),
								j.jsxIdentifier( 'Positioner' )
							),
							positionerAttrs,
							true
						),
						null,
						[]
					)
				)
			);
		}
	}

	// Build <Tooltip.Trigger render={ child } />
	const triggerAttrs = [
		j.jsxAttribute(
			j.jsxIdentifier( 'render' ),
			j.jsxExpressionContainer( triggerRenderArg )
		),
	];
	const trigger = j.jsxElement(
		j.jsxOpeningElement(
			j.jsxMemberExpression(
				j.jsxIdentifier( targetName ),
				j.jsxIdentifier( 'Trigger' )
			),
			triggerAttrs,
			true
		),
		null,
		[]
	);

	// Build <Tooltip.Popup [positioner] [className]>{ text }</Tooltip.Popup>
	const popupAttrs = [];
	if ( positionerAttr ) {
		popupAttrs.push( positionerAttr );
	}
	if ( propMap.className ) {
		popupAttrs.push(
			j.jsxAttribute( j.jsxIdentifier( 'className' ), propMap.className )
		);
	}
	const popup = j.jsxElement(
		j.jsxOpeningElement(
			j.jsxMemberExpression(
				j.jsxIdentifier( targetName ),
				j.jsxIdentifier( 'Popup' )
			),
			popupAttrs,
			false
		),
		j.jsxClosingElement(
			j.jsxMemberExpression(
				j.jsxIdentifier( targetName ),
				j.jsxIdentifier( 'Popup' )
			)
		),
		[ popupChild ]
	);

	// Build <Tooltip.Root [key]>{trigger}{popup}</Tooltip.Root>
	const rootAttrs = [];
	if ( propMap.key ) {
		rootAttrs.push(
			j.jsxAttribute( j.jsxIdentifier( 'key' ), propMap.key )
		);
	}
	const newRoot = j.jsxElement(
		j.jsxOpeningElement(
			j.jsxMemberExpression(
				j.jsxIdentifier( targetName ),
				j.jsxIdentifier( 'Root' )
			),
			rootAttrs,
			false
		),
		j.jsxClosingElement(
			j.jsxMemberExpression(
				j.jsxIdentifier( targetName ),
				j.jsxIdentifier( 'Root' )
			)
		),
		[ trigger, popup ]
	);

	return { kind: 'ok', node: newRoot };
}

module.exports.parser = 'tsx';
