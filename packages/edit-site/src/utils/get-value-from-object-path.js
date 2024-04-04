export default function getValueFromObjectPath( object, path ) {
	let value = object;
	path.forEach( ( fieldName ) => {
		value = value?.[ fieldName ];
	} );
	return value;
}
