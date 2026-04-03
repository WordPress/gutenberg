module.exports = ( rootDir, docPath, symbols ) => {
	return JSON.stringify( symbols, null, 2 );
};
