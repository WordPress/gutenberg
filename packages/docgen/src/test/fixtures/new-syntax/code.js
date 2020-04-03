/**
 * A function that tests new syntaxes (ES2020)
 */
export const g = () => {
	const x = {};

	try {
		process.stdout.write( x?.text() );
	} catch {
		process.stdout.write( `it didn't work.` );
	}
};
