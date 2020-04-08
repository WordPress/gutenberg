export const TYPES = [ 'all', 'pairs', 'custom' ];

export const DEFAULT_VALUES = {
	top: [ 0, 'px' ],
	right: [ 0, 'px' ],
	bottom: [ 0, 'px' ],
	left: [ 0, 'px' ],
};

export function parseValues( values = {} ) {
	const nextValueProps = {};

	Object.keys( DEFAULT_VALUES ).forEach( ( key ) => {
		const defaultValue = DEFAULT_VALUES[ key ];
		const prop = values[ key ] || [];

		nextValueProps[ key ] = [
			prop?.[ 0 ] || defaultValue[ 0 ],
			prop?.[ 1 ] || defaultValue[ 1 ],
		];
	} );

	return nextValueProps;
}

export function getValues( values, ...args ) {
	const nextValues = [];
	args.forEach( ( key ) => {
		nextValues.push( values[ key ][ 0 ] );
	} );

	return nextValues;
}
