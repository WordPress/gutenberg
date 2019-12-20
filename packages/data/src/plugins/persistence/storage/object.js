let objectStorage;

const storage = {
	getItem( key ) {
		if ( ! objectStorage || ! objectStorage[ key ] ) {
			return null;
		}

		return objectStorage[ key ];
	},
	setItem( key, value ) {
		if ( ! objectStorage ) {
			storage.clear();
		}

		objectStorage[ key ] = String( value );
	},
	clear() {
		objectStorage = Object.create( null );
	},
};

export default storage;
