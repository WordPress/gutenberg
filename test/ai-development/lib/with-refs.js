/**
 * Expands a spec's cases across the Git refs under evaluation.
 *
 * Promptfoo compares prompts and providers, but has no notion of the tree an
 * agent works in. This supplies that axis: every case runs once per ref, in one
 * table, so a guidance change can be measured against the commit before it.
 *
 * `EVAL_REFS` is a comma-separated list and defaults to `HEAD`, so a plain run
 * measures the branch you are on.
 *
 * @param {import('promptfoo').TestCase[]} cases A spec's own cases.
 * @return {import('promptfoo').TestCase[]} One case per ref.
 */
export default function withRefs( cases ) {
	const refs = ( process.env.EVAL_REFS || 'HEAD' )
		.split( ',' )
		.map( ( ref ) => ref.trim() )
		.filter( Boolean );

	if ( ! refs.length ) {
		throw new Error( 'EVAL_REFS is set but empty.' );
	}

	// One ref reads as a plain run, so only label rows when comparing.
	const label = ( description, ref ) =>
		refs.length > 1 ? `${ description } @ ${ ref }` : description;

	return refs.flatMap( ( baseRef ) =>
		cases.map( ( testCase ) => ( {
			...testCase,
			description: label( testCase.description, baseRef ),
			vars: { ...testCase.vars, baseRef },
		} ) )
	);
}
