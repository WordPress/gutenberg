export const CSS_UNITS = [
	{ value: 'px', label: 'px', default: 0 },
	{ value: '%', label: '%', default: 10 },
	{ value: 'em', label: 'em', default: 0 },
	{ value: 'rem', label: 'rem', default: 0 },
	{ value: 'vw', label: 'vw', default: 10 },
	{ value: 'vh', label: 'vh', default: 10 },
];

export function getComputedSize( { value = 0, unit = 'px' } ) {
	if ( unit === 'px' ) {
		return value;
	}

	if ( unit === 'em' || unit === 'rem' ) {
		const { fontSize } = window.getComputedStyle(
			document.documentElement
		);
		return parseFloat( fontSize ) * value;
	}

	const windowValue = unit === 'vw' ? window.innerWidth : window.innerHeight;

	return Math.round( windowValue * ( value / 100 ) );
}
