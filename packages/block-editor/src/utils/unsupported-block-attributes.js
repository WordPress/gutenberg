/**
 * Attribute paths whose control is gated by an editor setting, so a newly
 * created block only carries values its author can also see and change.
 */
const SETTING_GATES = [
	{
		attribute: 'fontSize',
		setting: 'typography.fontSizes',
		isSupported: ( fontSizes ) => !! fontSizes?.length,
	},
	{
		attribute: 'style.typography.textAlign',
		setting: 'typography.textAlign',
		isSupported: ( textAlign ) => !! textAlign,
	},
];

function getValueAtPath( object, path ) {
	return path.reduce( ( value, key ) => value?.[ key ], object );
}

function omitPath( object, [ key, ...rest ] ) {
	if ( ! object?.hasOwnProperty( key ) ) {
		return object;
	}
	const { [ key ]: value, ...remaining } = object;
	if ( rest.length ) {
		const child = omitPath( value, rest );
		if ( child && Object.keys( child ).length ) {
			return { ...object, [ key ]: child };
		}
	}
	return remaining;
}

// Cache per declared attributes object so repeated store reads return the
// same filtered reference while the resolved settings are unchanged.
const cache = new WeakMap();

/**
 * Returns the attributes without the ones whose governing editor setting
 * resolves to an unsupported value.
 *
 * @param {Object}   attributes Declared block attributes.
 * @param {Function} getSetting Resolves a setting path to its value.
 *
 * @return {Object} The filtered attributes.
 */
export function omitUnsupportedBlockAttributes( attributes, getSetting ) {
	if ( ! attributes ) {
		return attributes;
	}

	const gates = SETTING_GATES.filter(
		( { attribute } ) =>
			getValueAtPath( attributes, attribute.split( '.' ) ) !== undefined
	);
	const settingValues = gates.map( ( { setting } ) => getSetting( setting ) );

	const cached = cache.get( attributes );
	if (
		cached &&
		cached.settingValues.length === settingValues.length &&
		cached.settingValues.every(
			( value, index ) => value === settingValues[ index ]
		)
	) {
		return cached.result;
	}

	const result = gates.reduce(
		( filtered, { attribute, isSupported }, index ) =>
			isSupported( settingValues[ index ] )
				? filtered
				: omitPath( filtered, attribute.split( '.' ) ),
		attributes
	);
	cache.set( attributes, { settingValues, result } );
	return result;
}
