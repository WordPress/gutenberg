/**
 * Creates a nested, hierarchical tree representation from unstructured data that
 * has an inherent relationship defined between individual items.
 *
 * For example, by default, each element in the dataset should have an `id` and
 * `parent` property where the `parent` property indicates a relationship between
 * the current item and another item with a matching `id` propertys.
 *
 * This is useful for building linked lists of data from flat data structures.
 *
 * @param {Array} dataset linked data to be rearranged into a hierarchical tree based on relational fields.
 * @param {string} id the property which uniquey identifies each entry within the array.
 * @param {*} relation the property which identifies how the current item is related to other items in the data (if at all).
 */
function createDataTree( dataset, id = 'id', relation = 'parent' ) {
	const hashTable = Object.create( null );
	const dataTree = [];

	for ( const data of dataset ) {
		hashTable[ data[ id ] ] = {
			...data,
			children: [],
		};
	}
	for ( const data of dataset ) {
		if ( data[ relation ] ) {
			hashTable[ data[ relation ] ].children.push(
				hashTable[ data[ id ] ]
			);
		} else {
			dataTree.push( hashTable[ data[ id ] ] );
		}
	}

	return dataTree;
}

export default createDataTree;
