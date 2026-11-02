/**
 * What PHPUnit and the end-to-end order runner read from a fixture, worked
 * out by the oracle once and stored next to it in `overlaps/generated/`, so
 * neither has to reimplement the model.
 */
import {
	allSequences,
	applyDecision,
	buildFixtureState,
	decisionsOf,
	displayed,
	label,
	publishedChars,
	renderHTML,
	sampleSequences,
	suggestionOperation,
	toContentHTML,
} from './overlap-oracle';
import type { Decision, Fixture } from './overlap-oracle';

/** Orders the end-to-end runner gets for a fixture of four or more. */
export const SAMPLED_ORDERS = 24;

/**
 * The generated data for a fixture.
 *
 * `html` holds `{{id:KEY}}` and `{{author:KEY}}` placeholders for the note id
 * and author of each suggestion.
 *
 * @param fixture Fixture.
 * @return Generated data.
 */
export function generateFixtureData( fixture: Fixture ) {
	const state = buildFixtureState( fixture );
	const keyOf = ( id: string ) =>
		state.suggestions.find( ( s ) => s.id === id )!.key;
	const all = ( decision: Decision ) =>
		renderHTML(
			publishedChars(
				state,
				Object.fromEntries(
					state.suggestions.map( ( s ) => [ s.id, decision ] )
				)
			)
		);
	const exhaustive = state.suggestions.length <= 3;
	const sequences = exhaustive
		? allSequences( state )
		: sampleSequences( state, SAMPLED_ORDERS, 1 );
	return {
		name: fixture.name,
		phase: fixture.phase,
		users: fixture.users,
		html: toContentHTML( state, {
			noteId: ( id ) => `{{id:${ keyOf( id ) }}}`,
			authorOf: ( id ) => `{{author:${ keyOf( id ) }}}`,
		} ),
		suggestions: state.suggestions.map( ( s ) => ( {
			key: s.key,
			author: s.author,
			operation: suggestionOperation( state, s.id ),
		} ) ),
		views: {
			displayed: displayed( state ),
			acceptedHTML: all( 'accept' ),
			rejectedHTML: all( 'reject' ),
		},
		orders: {
			exhaustive,
			list: sequences.map( ( sequence ) => {
				let current = state;
				const steps = sequence.map( ( step ) => {
					current = applyDecision( current, step );
					return {
						key: keyOf( step.id ),
						decision: step.decision,
						displayed: displayed( current ),
						outdated: current.suggestions
							.filter( ( s ) => s.status === 'outdated' )
							.map( ( s ) => s.key ),
					};
				} );
				return {
					label: label( sequence, state ),
					steps,
					published: displayed( current ),
					accepted: sequence
						.filter( ( step ) => step.decision === 'accept' )
						.map( ( step ) => keyOf( step.id ) ),
					publishedHTML: renderHTML(
						publishedChars( current, decisionsOf( current ) )
					),
				};
			} ),
		},
	};
}
