let _objectStorage;

const storage = {
	getItem( key ) {
		if ( ! _objectStorage || ! _objectStorage[ key ] ) {
			return null;
		}

		return _objectStorage[ key ];
	},
	setItem( key, value ) {
		if ( ! _objectStorage ) {
			storage.clear();
		}

		_objectStorage[ key ] = String( value );
	},
	clear() {
		_objectStorage = Object.create( null );
	},
};

export default storage;
