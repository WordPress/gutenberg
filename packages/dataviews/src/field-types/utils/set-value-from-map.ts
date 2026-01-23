import type { PropertyMap } from '../../types';

/**
 * Creates a setValue function from a property map.
 *
 * Map syntax: `{ itemKey: 'valueKey' }` - writes `value[valueKey]` to `itemKey`.
 * Example: `{ id: 'id', src: 'url' }` writes `value.url` to `src`.
 *
 * @param map The property map defining the mapping from value keys to item paths.
 * @return A setValue function that creates a partial item update based on the map.
 */
const setValueFromMap =
	( map: PropertyMap ) =>
	( { value }: { value: any } ) => {
		const result: any = {};

		for ( const [ itemPath, valueKey ] of Object.entries( map ) ) {
			const parts = itemPath.split( '.' );
			let current = result;

			for ( const part of parts.slice( 0, -1 ) ) {
				current[ part ] = current[ part ] || {};
				current = current[ part ];
			}

			current[ parts.at( -1 )! ] = value[ valueKey ];
		}

		return result;
	};

export default setValueFromMap;
