const getArgsFromCLI = ( excludePrefixes ) => {
	const args = process.argv.slice( 2 );
	if ( excludePrefixes ) {
		return args.filter( ( arg ) => {
			return ! excludePrefixes.some( ( prefix ) => arg.startsWith( prefix ) );
		} );
	}
	return args;
};

module.exports = {
	exit: process.exit,
	getArgsFromCLI,
	getCurrentWorkingDirectory: process.cwd,
};
