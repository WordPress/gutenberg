const getAsBooleanFromENV = ( name ) => {
	const value = process.env[ name ];
	return !! value && value !== 'false' && value !== '0';
};

const getArgsFromCLI = ( excludePrefixes ) => {
	const args = process.argv.slice( 2 );
	if ( excludePrefixes ) {
		return args.filter( ( arg ) => {
			return ! excludePrefixes.some( ( prefix ) =>
				arg.startsWith( prefix )
			);
		} );
	}
	return args;
};

module.exports = {
	exit: process.exit,
	getAsBooleanFromENV,
	getArgsFromCLI,
	getCurrentWorkingDirectory: process.cwd,
};
