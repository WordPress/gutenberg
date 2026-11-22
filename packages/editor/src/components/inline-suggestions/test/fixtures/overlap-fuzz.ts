/**
 * Random overlap fixtures for property tests. Every fixture comes from a
 * seed, so a failure is replayed by its seed alone.
 */
import { buildFixtureState, lcg } from './overlap-oracle';
import type { Fixture, FixtureSuggestion, Kind } from './overlap-oracle';

const WORDS = [ 'red', 'fox', 'jumps', 'over', 'lazy', 'dog', 'quick', 'sun' ];
const FORMATS = [ 'core/bold', 'core/italic' ];
const KEYS = [ 'A', 'B', 'C', 'D', 'E', 'F' ];

/**
 * A random fixture of three to six suggestions, each by its own author.
 *
 * @param seed          Seed.
 * @param options       Options.
 * @param options.kinds Kinds to draw from.
 * @param options.min   Fewest suggestions.
 * @param options.max   Most suggestions.
 * @return Fixture.
 */
export function randomFixture(
	seed: number,
	{
		kinds = [ 'add', 'del', 'format' ] as Kind[],
		min = 3,
		max = 6,
	}: { kinds?: Kind[]; min?: number; max?: number } = {}
): Fixture {
	const random = lcg( seed );
	const pick = < T >( items: T[] ): T =>
		items[ Math.floor( random() * items.length ) ];
	const between = ( low: number, high: number ) =>
		low + Math.floor( random() * ( high - low + 1 ) );
	const base = Array.from( { length: between( 2, 4 ) }, () =>
		pick( WORDS )
	).join( ' ' );
	const fixture: Fixture = {
		name: `fuzz-${ seed }`,
		phase: kinds.includes( 'format' ) ? 'B' : 'A',
		users: {},
		base,
		baseFormats:
			random() < 0.5
				? [
						{
							range: [ 0, between( 1, base.length ) ],
							formats: [ pick( FORMATS ) ],
						},
					]
				: [],
		suggestions: [],
		expect: { 'all-accepted': '', 'all-rejected': '' },
	};
	const count = between( min, max );
	for ( let index = 0; index < count; index++ ) {
		const key = KEYS[ index ];
		fixture.users[ key ] = `overlap-${ key.toLowerCase() }`;
		const length = buildFixtureState( fixture ).chars.length;
		let suggestion: FixtureSuggestion | undefined;
		for ( let attempt = 0; attempt < 5 && ! suggestion; attempt++ ) {
			const kind = pick( kinds );
			if ( kind === 'add' || length === 0 ) {
				suggestion = {
					key,
					author: key,
					kind: 'add',
					text: ` ${ pick( WORDS ) }`,
					at: between( 0, length ),
				};
				continue;
			}
			const start = between( 0, length - 1 );
			const range: [ number, number ] = [
				start,
				between( start + 1, Math.min( length, start + 8 ) ),
			];
			if ( kind === 'del' ) {
				suggestion = { key, author: key, kind, range };
				continue;
			}
			const candidate: FixtureSuggestion = {
				key,
				author: key,
				kind,
				range,
				added: FORMATS.filter( () => random() < 0.5 ),
				removed: FORMATS.filter( () => random() < 0.3 ),
			};
			// A gesture only records formatting that changes something.
			const state = buildFixtureState( {
				...fixture,
				suggestions: [ ...fixture.suggestions, candidate ],
			} );
			const id = String( index + 1 );
			if (
				state.chars.some(
					( char ) =>
						char.deltas[ id ] &&
						( char.deltas[ id ].added.length ||
							char.deltas[ id ].removed.length )
				)
			) {
				suggestion = candidate;
			}
		}
		fixture.suggestions.push(
			suggestion ?? {
				key,
				author: key,
				kind: 'add',
				text: ` ${ pick( WORDS ) }`,
				at: between( 0, length ),
			}
		);
	}
	return fixture;
}
