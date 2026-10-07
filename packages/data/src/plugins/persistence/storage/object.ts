import type { StorageInterface } from '../../../types';

let objectStorage: Record< string, string > | undefined;

const storage: StorageInterface & { clear: VoidFunction } = {
	getItem( key: string ): string | null {
		if ( ! objectStorage || ! objectStorage[ key ] ) {
			return null;
		}

		return objectStorage[ key ];
	},
	setItem( key: string, value: string ) {
		if ( ! objectStorage ) {
			storage.clear();
		}

		objectStorage![ key ] = String( value );
	},
	clear() {
		objectStorage = Object.create( null );
	},
};

export default storage;
