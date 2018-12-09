import chalk from 'chalk';

export const logA11yResults = ( a11yResults ) => {
	const { violations } = a11yResults;
	if ( violations.length === 0 ) {
		return;
	}

	for ( const violation of violations ) {
		const selectors = violation.nodes.map( ( node ) => `"${ node.target }"` ).join( ', ' );
		process.stderr.write( `[${ chalk.bold.red( 'a11y' ) }] ${ violation.id }: ${ violation.description } (elements ${ selectors })` );
	}
	process.stderr.write( '\n' );
};
