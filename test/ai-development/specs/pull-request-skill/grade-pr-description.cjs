/**
 * Deterministic grader for the pull-requests skill eval.
 *
 * Only structural rules live here — things that are true or false by reading
 * the markup, with no judgement about prose. Everything else is left to the
 * agent-rubric in the spec, which can weigh wording in context.
 *
 * Deliberately not checked, and worth revisiting:
 *
 * -   **Keyboard testing.** The template asks for it on user-interface changes
 *     only, so requiring it unconditionally fails a correct description of a
 *     change with no UI — the current fixture is one.
 * -   **Observable testing steps.** Matching verbs like "confirm" or "verify"
 *     rejects perfectly observable phrasing that happens to use other words.
 * -   **No setup boilerplate.** Whether `npm install` belongs in the steps
 *     depends on the change; a pattern match cannot tell.
 * -   **Succinctness.** A word cap failed a description the rubric judged good,
 *     so the limit needs calibrating against real output before it can grade.
 *
 * Each of those is a judgement, and encoding judgements as regular expressions
 * is what made earlier versions of this eval fail correct work.
 *
 * Every component must pass (threshold: 1 in the spec).
 */

function check( label, passed, detail ) {
	return {
		pass: Boolean( passed ),
		score: passed ? 1 : 0,
		reason: `${ label }: ${ detail }`,
		namedScores: { [ label ]: passed ? 1 : 0 },
	};
}

function section( text, heading ) {
	// Content from `heading` to the next same-or-higher-level heading.
	const level = heading.match( /^#+/ )[ 0 ].length;
	const escaped = heading.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	const pattern = new RegExp(
		`^${ escaped }\\s*$([\\s\\S]*?)(?=^#{1,${ level }} |(?![\\s\\S]))`,
		'm'
	);
	const match = text.match( pattern );
	return match ? match[ 1 ] : null;
}

function gradePrDescription( output ) {
	const text = String( output || '' );

	const headings = [
		'## What?',
		'## Why?',
		'## How?',
		'## Testing Instructions',
	];
	const positions = headings.map( ( heading ) => text.indexOf( heading ) );
	const hasSections =
		positions.every( ( position ) => position !== -1 ) &&
		positions.every(
			( position, index ) =>
				index === 0 || position > positions[ index - 1 ]
		);

	const disclosure = section( text, '## Use of AI Tools' );
	const hasDisclosure =
		disclosure !== null && disclosure.trim().split( /\s+/ ).length >= 4;

	const components = [
		check(
			'Template sections',
			hasSections,
			hasSections
				? 'What/Why/How/Testing Instructions present and in order'
				: 'missing or misordered What/Why/How/Testing Instructions sections'
		),
		check(
			'AI disclosure',
			hasDisclosure,
			hasDisclosure
				? 'fills in the "Use of AI Tools" section'
				: 'missing or empty "Use of AI Tools" section'
		),
	];

	const score =
		components.reduce( ( sum, item ) => sum + item.score, 0 ) /
		components.length;

	return {
		pass: score === 1,
		score,
		reason:
			components
				.filter( ( item ) => ! item.pass )
				.map( ( item ) => item.reason )
				.join( '; ' ) || 'all checks passed',
		componentResults: components,
	};
}

module.exports = ( output ) => gradePrDescription( output );
module.exports.gradePrDescription = gradePrDescription;
