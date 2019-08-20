export function Image( { src, alt, ...additionalProps } ) {
	if ( ! src ) {
		return null;
	}

	return (
		<img
			alt={ alt }
			src={ src }
			{ ...additionalProps }
		/>
	);
}
