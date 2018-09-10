function AccessibleSVG( props ) {
	const appliedProps = {
		...props,
		role: 'img',
		'aria-hidden': 'true',
		focusable: 'false',
	};

	return <svg { ...appliedProps } />;
}

export default AccessibleSVG;
