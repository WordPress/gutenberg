export function createStyles( state ) {
	const mappedStyles = Object.keys( state ).reduce( ( styles, key ) => {
		const value = state[ key ];
		let styleValue;
		switch ( key ) {
			case 'blur':
				styleValue = `${ value }px`;
				break;
			case 'hue-rotate':
				styleValue = `${ value }deg`;
				break;
			default:
				styleValue = `${ value }%`;
				break;
		}
		const next = `${ key }(${ styleValue })`;

		return [ ...styles, next ];
	}, [] );

	return {
		filter: mappedStyles.join( ' ' ),
	};
}
