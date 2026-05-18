/**
 * Internal dependencies
 */
import getValueFromId from './get-value-from-id';
import type { PropertyMap } from '../../types';

/**
 * Creates a getValue function from a property map.
 *
 * Map syntax: `{ outputKey: 'itemPath' }` - reads `item[itemPath]` as `outputKey`.
 * Example: `{ id: 'id', url: 'src' }` reads `item.src` as `url`.
 *
 * @param map The property map defining the mapping from item paths to output keys.
 * @return A getValue function that extracts values from an item based on the map.
 */
const getValueFromMap =
	( map: PropertyMap ) =>
	( { item }: { item: any } ) => {
		const result: any = {};
		for ( const [ outputKey, itemPath ] of Object.entries( map ) ) {
			result[ outputKey ] = getValueFromId( itemPath )( { item } );
		}
		return result;
	};

export default getValueFromMap;
