const startCase = ( input ) => {
	return input.split( ' ' ).map( upperFirst ).join( ' ' );
};

const upperFirst = ( input ) => {
	return input.charAt( 0 ).toUpperCase() + input.slice( 1 );
};

module.exports = {
	startCase,
	upperFirst,
};
