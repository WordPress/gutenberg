let _objectStorage;

const storage = {
	getItem( key ) {
		if ( ! _objectStorage ) {
			return;
		}

		return _objectStorage[ key ];
	},
	setItem( key, value ) {
		if ( ! _objectStorage ) {
			storage.clear();
		}

		_objectStorage[ key ] = value;
	},
	clear() {
		_objectStorage = Object.create( null );
	},
};

export default storage;
