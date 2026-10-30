const setValueFromId =
	( id: string ) =>
	( { value }: { value: any } ) => {
		const path = id.split( '.' );
		const result: any = {};
		let current = result;

		for ( const segment of path.slice( 0, -1 ) ) {
			current[ segment ] = {};
			current = current[ segment ];
		}

		current[ path.at( -1 )! ] = value;
		return result;
	};

export default setValueFromId;
