import typescriptEslintParser from '@typescript-eslint/parser';

const browserApiIdentifiers = new Set( [
	'IntersectionObserver',
	'ResizeObserver',
	'cancelAnimationFrame',
	'matchMedia',
	'requestAnimationFrame',
	'scrollBy',
	'scrollTo',
] );
const browserApiProperties = new Set( [
	...browserApiIdentifiers,
	'animate',
	'clientHeight',
	'clientLeft',
	'clientTop',
	'clientWidth',
	'getBoundingClientRect',
	'getClientRects',
	'innerHeight',
	'innerWidth',
	'offsetHeight',
	'offsetLeft',
	'offsetTop',
	'offsetWidth',
	'scrollHeight',
	'scrollIntoView',
	'scrollLeft',
	'scrollTop',
	'scrollWidth',
] );
const renderedUiImports = new Map( [
	[ '@testing-library/react', new Set( [ 'render', 'renderHook' ] ) ],
	[
		'@wordpress/element',
		new Set( [ 'createRoot', 'hydrate', 'hydrateRoot', 'render' ] ),
	],
	[ 'react-dom', new Set( [ 'hydrate', 'render' ] ) ],
	[ 'react-dom/client', new Set( [ 'createRoot', 'hydrateRoot' ] ) ],
] );

function getImportedName( specifier ) {
	if ( specifier.type === 'ImportDefaultSpecifier' ) {
		return 'default';
	}

	if ( specifier.type === 'ImportNamespaceSpecifier' ) {
		return '*';
	}

	return specifier.imported?.name ?? specifier.imported?.value ?? null;
}

function getMemberPropertyName( node ) {
	if ( node?.type !== 'MemberExpression' ) {
		return null;
	}

	if ( ! node.computed && node.property?.type === 'Identifier' ) {
		return node.property.name;
	}

	if (
		node.computed &&
		( node.property?.type === 'Literal' ||
			node.property?.type === 'StringLiteral' )
	) {
		return node.property.value;
	}

	return null;
}

function traverseAst( node, visitorKeys, visitor ) {
	if ( ! node?.type ) {
		return;
	}

	visitor( node );

	for ( const key of visitorKeys[ node.type ] ?? [] ) {
		const child = node[ key ];
		if ( Array.isArray( child ) ) {
			child.forEach( ( item ) =>
				traverseAst( item, visitorKeys, visitor )
			);
		} else if ( child?.type ) {
			traverseAst( child, visitorKeys, visitor );
		}
	}
}

/**
 * Validate policy rules that distinguish Node, jsdom, and Browser Mode tests.
 *
 * @param {Object}  options
 * @param {string}  options.file
 * @param {string}  options.source
 * @param {string}  options.project
 * @param {boolean} [options.allowBrowserFireEvent]
 * @param {boolean} [options.allowJsdomBrowserApis]
 * @param {boolean} [options.allowRenderedUi]
 * @return {string[]} Policy violations.
 */
export function validateVitestPolicy( {
	file,
	source,
	project,
	allowBrowserFireEvent = false,
	allowJsdomBrowserApis = false,
	allowRenderedUi = false,
} ) {
	const { ast, scopeManager, visitorKeys } =
		typescriptEslintParser.parseForESLint( source, {
			filePath: file,
			jsxFragmentName: null,
			jsxPragma: null,
			loc: true,
			range: true,
			sourceType: 'module',
		} );
	const unboundIdentifiers = new Set(
		scopeManager.globalScope?.through.map(
			( reference ) => reference.identifier
		) ?? []
	);
	const importedNamespaces = new Set();
	const violations = [];
	const reported = new Set();

	const report = ( category, line, message ) => {
		if ( reported.has( category ) ) {
			return;
		}
		reported.add( category );
		violations.push( `${ file }:${ line } ${ message }` );
	};

	for ( const node of ast.body ) {
		if ( node.type !== 'ImportDeclaration' ) {
			continue;
		}

		const importSource = node.source.value;
		for ( const specifier of node.specifiers ) {
			if ( specifier.type === 'ImportNamespaceSpecifier' ) {
				importedNamespaces.add( specifier.local.name );
			}
		}

		if (
			project === 'browser' &&
			importSource === '@testing-library/user-event'
		) {
			report(
				'browser-user-event',
				node.loc.start.line,
				"Browser tests must import { userEvent } from 'vitest/browser'"
			);
		}

		if (
			project === 'browser' &&
			[ '@testing-library/dom', '@testing-library/react' ].includes(
				importSource
			) &&
			node.specifiers.some(
				( specifier ) => getImportedName( specifier ) === 'fireEvent'
			) &&
			! allowBrowserFireEvent
		) {
			report(
				'browser-fire-event',
				node.loc.start.line,
				'Browser tests must use userEvent or locators; allow fireEvent only when the low-level event is the contract'
			);
		}

		const renderedImports = renderedUiImports.get( importSource );
		if (
			project === 'jsdom' &&
			renderedImports &&
			node.specifiers.some( ( specifier ) => {
				const importedName = getImportedName( specifier );
				return (
					renderedImports.has( importedName ) ||
					importedName === 'default' ||
					importedName === '*'
				);
			} ) &&
			! allowRenderedUi
		) {
			report(
				'jsdom-rendered-ui',
				node.loc.start.line,
				'rendered UI tests default to Browser Mode; use Node for pure logic or add an explicit jsdom baseline entry for low-level DOM semantics'
			);
		}
	}

	traverseAst( ast, visitorKeys, ( node ) => {
		if ( project === 'jsdom' && ! allowJsdomBrowserApis ) {
			if (
				node.type === 'Identifier' &&
				browserApiIdentifiers.has( node.name ) &&
				unboundIdentifiers.has( node )
			) {
				report(
					'jsdom-browser-api',
					node.loc.start.line,
					'layout, geometry, viewport, observer, animation, and scroll APIs require Browser Mode or an explicit jsdom exception with a concrete reason'
				);
			}

			if (
				node.type === 'MemberExpression' &&
				browserApiProperties.has( getMemberPropertyName( node ) )
			) {
				report(
					'jsdom-browser-api',
					node.loc.start.line,
					'layout, geometry, viewport, observer, animation, and scroll APIs require Browser Mode or an explicit jsdom exception with a concrete reason'
				);
			}
		}

		if (
			project === 'browser' &&
			node.type === 'CallExpression' &&
			getMemberPropertyName( node.callee ) === 'spyOn' &&
			node.callee.object?.type === 'Identifier' &&
			node.callee.object.name === 'vi' &&
			node.arguments[ 0 ]?.type === 'Identifier' &&
			importedNamespaces.has( node.arguments[ 0 ].name )
		) {
			report(
				'browser-namespace-spy',
				node.loc.start.line,
				'Browser tests cannot spy on imported ESM namespace objects; mock before import or inject the dependency'
			);
		}
	} );

	return violations;
}
