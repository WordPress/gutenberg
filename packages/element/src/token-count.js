let tokenCount = {};

const updateTokenCount = ( type ) => {
	if ( typeof tokenCount[ type ] === 'undefined' ) {
		tokenCount[ type ] = 0;
	}
	tokenCount[ type ]++;
};

const getTokenCount = ( type ) => {
	if ( typeof tokenCount[ type ] === 'undefined' ) {
		tokenCount[ type ] = 0;
	}
	updateTokenCount( type );
	return tokenCount[ type ];
};

const resetTokenCount = () => {
	tokenCount = {};
};

export {
	getTokenCount,
	resetTokenCount,
};
