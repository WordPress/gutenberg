import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * This suite guards the `privateApis` seam between `@wordpress/interactivity`
 * and `@wordpress/interactivity-router` — the mechanism this feature relies
 * on to reach the directive runtime's `afterNextFrame` scheduler and its
 * `getScope` probe. It is deliberately **source-level**, reading both files
 * as text rather than importing them, for two independent reasons:
 *
 * 1. `packages/interactivity/src/index.ts` opens with a top-level
 *    `await import( 'preact/debug' )`, so evaluating the runtime module would
 *    add unrelated module-loading behaviour to this source-level check.
 * 2. Even if it could be imported, `privateApis` is typed `( lock: … ): any`,
 *    so TypeScript does not check the shape the router destructures from it.
 *    Nothing short of reading both sides' source text can catch a name that
 *    one end stops providing and the other still expects.
 *
 * It lives on this side of the seam — `interactivity-router`, not
 * `interactivity` — because it reads both packages' source, and
 * `interactivity` is the lower architectural layer: it must not know the
 * router exists, so the cross-cutting test belongs to the higher layer that
 * consumes the seam. Keeping the check here avoids coupling the lower layer
 * to the router.
 *
 * The suite deliberately covers both ends of the seam in one file: the
 * producer (what `privateApis` returns) and the consumer (what the router
 * destructures from it), so a mismatch introduced on either side is caught
 * here regardless of which file a change actually touched.
 */

const INTERACTIVITY_INDEX_PATH_FROM_REPO_ROOT =
	'packages/interactivity/src/index.ts';
/** Repository-relative path to the directive runtime's vDOM implementation. */
const INTERACTIVITY_VDOM_PATH_FROM_REPO_ROOT =
	'packages/interactivity/src/vdom.ts';
const ROUTER_INDEX_PATH_FROM_REPO_ROOT =
	'packages/interactivity-router/src/index.ts';

const interactivityIndexSource = readFileSync(
	join(
		dirname( fileURLToPath( import.meta.url ) ),
		'../../../interactivity/src/index.ts'
	),
	'utf-8'
);
/** Source text used to verify the shared directive-value implementation. */
const interactivityVdomSource = readFileSync(
	join(
		dirname( fileURLToPath( import.meta.url ) ),
		'../../../interactivity/src/vdom.ts'
	),
	'utf-8'
);
const routerIndexSource = readFileSync(
	join( dirname( fileURLToPath( import.meta.url ) ), '../index.ts' ),
	'utf-8'
);

/**
 * Extracts the identifier names of the object literal returned inside
 * `privateApis` in `packages/interactivity/src/index.ts` — the producer side
 * of the seam. Every entry there is a bare (shorthand) identifier, so this
 * strips `//`-style comments out of the block before splitting on commas.
 *
 * @param source The full text of `packages/interactivity/src/index.ts`.
 * @return       The bare identifier names listed in the returned literal.
 */
function getPrivateApisProducerNames( source: string ): string[] {
	const privateApisStart = source.indexOf( 'export const privateApis' );
	if ( privateApisStart === -1 ) {
		throw new Error(
			`Could not find "export const privateApis" in ${ INTERACTIVITY_INDEX_PATH_FROM_REPO_ROOT }.`
		);
	}

	const returnKeyword = 'return {';
	const returnStart = source.indexOf( returnKeyword, privateApisStart );
	if ( returnStart === -1 ) {
		throw new Error(
			`Could not find the "${ returnKeyword }" that opens privateApis' returned object literal in ${ INTERACTIVITY_INDEX_PATH_FROM_REPO_ROOT }.`
		);
	}

	const literalBodyStart = returnStart + returnKeyword.length;
	const literalEnd = source.indexOf( '};', literalBodyStart );
	if ( literalEnd === -1 ) {
		throw new Error(
			`Could not find the closing "};" of privateApis' returned object literal in ${ INTERACTIVITY_INDEX_PATH_FROM_REPO_ROOT }.`
		);
	}

	const literalBody = source
		.slice( literalBodyStart, literalEnd )
		// Strip `//`-style line comments (e.g. the `getScope` comment).
		.replace( /\/\/.*$/gm, '' );

	return literalBody
		.split( ',' )
		.map( ( entry ) => entry.trim() )
		.filter( ( entry ) => entry.length > 0 );
}

/**
 * Extracts the *source* names the router takes from the single
 * `const { … } = privateApis( … )` destructure in
 * `packages/interactivity-router/src/index.ts` — the consumer side of the
 * seam. A renamed entry (`h: createElement`) contributes its source name
 * (`h`), not its local binding (`createElement`), because the seam contract
 * is about what `privateApis` provides, not what the router calls it.
 *
 * @param source The full text of `packages/interactivity-router/src/index.ts`.
 * @return       The source (left-of-colon) names the router destructures.
 */
function getPrivateApisConsumerSourceNames( source: string ): string[] {
	const destructureStart = source.indexOf( 'const {' );
	if ( destructureStart === -1 ) {
		throw new Error(
			`Could not find the "const { … } = privateApis( … )" destructure in ${ ROUTER_INDEX_PATH_FROM_REPO_ROOT }.`
		);
	}

	const closer = '} = privateApis(';
	const destructureEnd = source.indexOf( closer, destructureStart );
	if ( destructureEnd === -1 ) {
		throw new Error(
			`Could not find the "${ closer }" that closes the router's destructure in ${ ROUTER_INDEX_PATH_FROM_REPO_ROOT }.`
		);
	}

	const destructureBody = source.slice(
		destructureStart + 'const {'.length,
		destructureEnd
	);

	return destructureBody
		.split( ',' )
		.map( ( entry ) => entry.trim() )
		.filter( ( entry ) => entry.length > 0 )
		.map( ( entry ) => {
			// A renamed entry reads `sourceName: localBinding` — take the
			// name to the left of the colon, which is what `privateApis`
			// actually provides.
			const renamed = entry.match( /^(\w+)\s*:\s*\w+$/ );
			return renamed ? renamed[ 1 ] : entry;
		} );
}

/**
 * Extracts every identifier named as an exported name by
 * `packages/interactivity/src/index.ts` — covering both `export { a, b }`
 * (with or without `from '…'`) and `export const|function|class NAME`. This
 * intentionally does not look inside the body of `privateApis` (which is
 * itself exported and legitimately *references* `afterNextFrame` and
 * `getScope` internally) — it looks only at what is named as an export.
 *
 * @param source The full text of `packages/interactivity/src/index.ts`.
 * @return       Every name that source exports.
 */
function getPublicExportNames( source: string ): string[] {
	const names: string[] = [];

	for ( const match of source.matchAll(
		/export\s*\{([^}]*)\}(?:\s*from\s*'[^']*')?/g
	) ) {
		for ( const entry of match[ 1 ].split( ',' ) ) {
			const trimmed = entry.trim().replace( /^type\s+/, '' );
			if ( trimmed.length > 0 ) {
				names.push( trimmed );
			}
		}
	}

	for ( const match of source.matchAll(
		/export\s+(?:const|function|class)\s+(\w+)/g
	) ) {
		names.push( match[ 1 ] );
	}

	return names;
}

describe( 'privateApis seam (packages/interactivity ↔ packages/interactivity-router)', () => {
	it( `lists afterNextFrame, getScope, and parseDirectiveValue in the object literal returned by privateApis in ${ INTERACTIVITY_INDEX_PATH_FROM_REPO_ROOT }`, () => {
		const producerNames = getPrivateApisProducerNames(
			interactivityIndexSource
		);

		expect( producerNames ).toEqual(
			expect.arrayContaining( [
				'afterNextFrame',
				'getScope',
				'parseDirectiveValue',
			] )
		);
	} );

	it( `has every name the router destructures from privateApis, by source name, present in ${ INTERACTIVITY_INDEX_PATH_FROM_REPO_ROOT }'s returned literal`, () => {
		const producerNames = getPrivateApisProducerNames(
			interactivityIndexSource
		);
		const consumerSourceNames =
			getPrivateApisConsumerSourceNames( routerIndexSource );

		// Sanity check on the extraction itself: the router renames one
		// entry (`h: createElement`), so if this ever stopped finding `h`
		// among the source names, the parser — not the seam — would be
		// broken, and the assertion below would pass for the wrong reason.
		expect( consumerSourceNames ).toContain( 'h' );
		expect( consumerSourceNames ).not.toContain( 'createElement' );
		expect( consumerSourceNames ).toContain( 'parseDirectiveValue' );

		const missing = consumerSourceNames.filter(
			( name ) => ! producerNames.includes( name )
		);

		expect( {
			missingFromProducer: missing,
			producerFile: INTERACTIVITY_INDEX_PATH_FROM_REPO_ROOT,
			consumerFile: ROUTER_INDEX_PATH_FROM_REPO_ROOT,
		} ).toEqual( {
			missingFromProducer: [],
			producerFile: INTERACTIVITY_INDEX_PATH_FROM_REPO_ROOT,
			consumerFile: ROUTER_INDEX_PATH_FROM_REPO_ROOT,
		} );
	} );

	it( `does not add afterNextFrame, getScope, or parseDirectiveValue to the public export surface of ${ INTERACTIVITY_INDEX_PATH_FROM_REPO_ROOT }`, () => {
		const publicExportNames = getPublicExportNames(
			interactivityIndexSource
		);

		expect( publicExportNames ).not.toContain( 'afterNextFrame' );
		expect( publicExportNames ).not.toContain( 'getScope' );
		expect( publicExportNames ).not.toContain( 'parseDirectiveValue' );
	} );

	it( `uses one directive-value interpretation in ${ INTERACTIVITY_VDOM_PATH_FROM_REPO_ROOT } and the router's region wrappers`, () => {
		const attributeLoopStart = interactivityVdomSource.indexOf(
			'\t\tfor ( let i = 0; i < attributes.length; i++ ) {'
		);
		const attributeLoopEnd = interactivityVdomSource.indexOf(
			'\n\t\t}\n\n\t\tif ( ignore && ! island )',
			attributeLoopStart
		);
		expect( attributeLoopStart ).toBeGreaterThanOrEqual( 0 );
		expect( attributeLoopEnd ).toBeGreaterThan( attributeLoopStart );

		const attributeLoop = interactivityVdomSource.slice(
			attributeLoopStart,
			attributeLoopEnd
		);
		expect( attributeLoop ).toContain(
			'parseDirectiveValue( attributeValue )'
		);
		expect( attributeLoop ).not.toContain( 'nsPathRegExp' );
		expect( attributeLoop ).not.toContain( 'JSON.parse' );
		expect( attributeLoop ).not.toContain( 'isObject' );

		for ( const functionName of [
			'parseRegionAttribute',
			'parseRegionId',
		] ) {
			const functionStart = routerIndexSource.indexOf(
				`const ${ functionName } =`
			);
			const functionEnd = routerIndexSource.indexOf(
				'\n};',
				functionStart
			);
			expect( functionStart ).toBeGreaterThanOrEqual( 0 );
			expect( functionEnd ).toBeGreaterThan( functionStart );

			const functionSource = routerIndexSource.slice(
				functionStart,
				functionEnd
			);
			expect( functionSource ).toContain( 'parseDirectiveValue' );
			expect( functionSource ).not.toContain( 'nsPathRegExp' );
			expect( functionSource ).not.toContain( 'namespacedValueRegExp' );
			expect( functionSource ).not.toContain( 'JSON.parse' );
			expect( functionSource ).not.toContain( 'constructor === Object' );
			expect( functionSource ).not.toContain( 'isObject' );
		}

		expect( routerIndexSource ).not.toContain( 'namespacedValueRegExp' );
	} );

	it( `still gates privateApis' returned literal behind the consent check, and throws "Forbidden access." outside it, in ${ INTERACTIVITY_INDEX_PATH_FROM_REPO_ROOT }`, () => {
		const consentTest = 'if ( lock === requiredConsent ) {';
		const forbidden = "throw new Error( 'Forbidden access.' );";

		const consentIndex = interactivityIndexSource.indexOf( consentTest );
		expect( consentIndex ).toBeGreaterThan( -1 );

		const returnStart = interactivityIndexSource.indexOf(
			'return {',
			consentIndex
		);
		expect( returnStart ).toBeGreaterThan( consentIndex );

		const literalEnd = interactivityIndexSource.indexOf(
			'};',
			returnStart
		);
		expect( literalEnd ).toBeGreaterThan( returnStart );

		const forbiddenIndex = interactivityIndexSource.indexOf( forbidden );
		expect( forbiddenIndex ).toBeGreaterThan( -1 );

		// The throw must sit after the closing brace of the returned
		// literal — i.e. outside the `if ( lock === requiredConsent )`
		// block — so `privateApis` still rejects any other lock string.
		expect( forbiddenIndex ).toBeGreaterThan( literalEnd );
	} );
} );
