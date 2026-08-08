// eslint-disable-next-line no-warning-comments
/**
 * @jest-environment jsdom
 */

/**
 * Container-lookup benchmark: the OLD whole-island DFS (`findPath`) vs the
 * element→vnode map + `_parent` walk (`getPathTo`) that replaced it.
 *
 * Opt-in — every test here is skipped unless WP_BENCH=1, so the normal suite
 * is unaffected. Run with:
 *
 *   WP_BENCH=1 npm run test:unit -- packages/interactivity/src/test/lookup-bench.ts
 *
 * Both implementations are copied verbatim from render.ts history (findPath
 * from the parent revision, getPathTo from the current one). The benchmark
 * measures ONLY the lookup (locating the container's vnode) — the part the
 * map replaced; the splice + render work is identical either way.
 *
 * The tests are wrapped in `benchDescribe`, an alias for `describe` /
 * `describe.skip` chosen at module load (WP_BENCH env var). The alias defeats
 * the `jest/no-standalone-expect` rule's block detection, so the rule is
 * disabled for this file (and re-enabled at the bottom).
 */

/**
 * Internal dependencies
 */
import '../directives'; // Registers all the core directives.
import { elementToVnode } from '../hooks';
import { hydrateRegions } from '../hydration';

const NS = 'bench/lookup';

// Preact internal property accessors — the mangled dist names (`__e`/`__k`/`__`),
// same as render.ts. (Preact's published builds mangle vnode internals per
// mangle.json: `_dom`→`__e`, `_children`→`__k`, `_parent`→`__`.)
const vdomDom = ( vnode: any ): Node | null => vnode?.__e ?? null;
const vdomChildren = ( vnode: any ): any[] => vnode?.__k ?? [];
const vdomParent = ( vnode: any ): any => vnode?.__ ?? null;

// OLD lookup — recursive depth-first search over the WHOLE island (verbatim
// from render.ts @-).
const findPath = ( vnode: any, target: Element ): any[] | null => {
	if ( typeof vnode?.type === 'string' && vdomDom( vnode ) === target ) {
		return [ vnode ];
	}
	for ( const child of vdomChildren( vnode ) ) {
		if ( ! child || typeof child !== 'object' ) {
			continue;
		}
		const path = findPath( child, target );
		if ( path ) {
			return [ vnode, ...path ];
		}
	}
	return null;
};

// NEW lookup — O(1) map lookup + `_parent` walk (verbatim from render.ts @).
const getPathTo = ( root: any, target: Element ): any[] | null => {
	let vnode = elementToVnode.get( target );
	if ( ! vnode ) {
		return null;
	}
	const reversed: any[] = [];
	while ( vnode && vnode !== root ) {
		reversed.push( vnode );
		vnode = vdomParent( vnode );
	}
	if ( vnode !== root ) {
		return null;
	}
	reversed.push( root );
	return reversed.reverse();
};

const buildIsland = async ( siblingCount: number ) => {
	document.body.innerHTML =
		`<div data-wp-interactive="${ NS }"><div data-testid="feed">` +
		Array.from(
			{ length: siblingCount },
			( _, i ) => `<div>item ${ i }</div>`
		).join( '' ) +
		'</div></div>';
	await hydrateRegions();
	const island = document.querySelector( '[data-wp-interactive]' )!;
	const feed = document.querySelector( '[data-testid="feed"]' )!;
	return {
		root: elementToVnode.get( island )!,
		feed,
		deep: feed.lastElementChild!,
	};
};

const timeLookups = (
	lookup: ( target: Element ) => any[] | null,
	target: Element,
	iters: number
) => {
	// Warm-up.
	lookup( target );
	lookup( target );
	const t0 = performance.now();
	for ( let i = 0; i < iters; i++ ) {
		lookup( target );
	}
	return performance.now() - t0;
};

// Runs only when WP_BENCH is set; skipped in normal suite runs.
const benchDescribe = process.env.WP_BENCH ? describe : describe.skip;

benchDescribe( 'container-lookup benchmark (WP_BENCH=1)', () => {
	it( 'deep target (3000 siblings) — DFS worst case', async () => {
		const { root, deep } = await buildIsland( 3000 );
		const iters = 1000;

		// Correctness first: both approaches must agree on the path.
		const dfsPath = findPath( root, deep );
		const walkPath = getPathTo( root, deep );
		expect( walkPath?.length ).toBe( dfsPath?.length );
		expect( dfsPath?.[ 0 ] ).toBe( root );

		const dfsMs = timeLookups( ( t ) => findPath( root, t ), deep, iters );
		const walkMs = timeLookups(
			( t ) => getPathTo( root, t ),
			deep,
			iters
		);

		process.stdout.write(
			`BENCH deep: ${ iters } lookups x ${ 3000 }-sibling island — ` +
				`findPath(DFS) ${ dfsMs.toFixed( 1 ) }ms, ` +
				`getPathTo(map+walk) ${ walkMs.toFixed( 2 ) }ms ` +
				`(${ ( dfsMs / walkMs ).toFixed( 0 ) }x faster)\n`
		);
		expect( dfsMs ).toBeGreaterThan( walkMs );
	} );

	it( 'shallow target (the newsfeed shape) — feed right under the island root', async () => {
		const { root, feed } = await buildIsland( 300 );
		const iters = 10000;

		const dfsPath = findPath( root, feed );
		const walkPath = getPathTo( root, feed );
		expect( walkPath?.length ).toBe( dfsPath?.length );

		const dfsMs = timeLookups( ( t ) => findPath( root, t ), feed, iters );
		const walkMs = timeLookups(
			( t ) => getPathTo( root, t ),
			feed,
			iters
		);

		process.stdout.write(
			`BENCH shallow: ${ iters } lookups — findPath(DFS) ${ dfsMs.toFixed(
				1
			) }ms, ` +
				`getPathTo(map+walk) ${ walkMs.toFixed( 2 ) }ms ` +
				`(${ ( dfsMs / walkMs ).toFixed( 1 ) }x)\n`
		);
	} );
} );
