export const CSS_UNITS = [
	{ value: 'px', label: 'px', default: 0 },
	{ value: '%', label: '%', default: 10 },
	{ value: 'em', label: 'em', default: 0 },
	{ value: 'rem', label: 'rem', default: 0 },
	{ value: 'vw', label: 'vw', default: 10 },
	{ value: 'vh', label: 'vh', default: 10 },
];

export const DEFAULT_UNIT = CSS_UNITS[ 0 ];

export function parseUnit( initialValue ) {
	const output = [ 0, '' ];

	const value = String( initialValue );
	const num = parseFloat( value, 10 );

	output[ 0 ] = num;
	output[ 1 ] = value.match( /[\d.\-\+]*\s*(.*)/ )[ 1 ] || '';

	return output;
}
