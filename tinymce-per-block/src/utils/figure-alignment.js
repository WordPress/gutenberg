export const getFigureAlignmentStyles = ( align ) => {
	const styles = {
		'align-left': {
			figure: 'float: left;'
		},
		'align-right': {
			figure: 'float: right;'
		},
		'align-center': {
			figure: 'text-align: center;'
		},
		'align-full-width': {
			figure: 'margin-left: calc(50% - 50vw);width: 100vw;max-width: none;padding-left: 0;padding-right: 0;',
			content: 'width: 100%'
		}
	};
	const figure = styles[ align ] && styles[ align ].figure
		? ` style="${ styles[ align ].figure }"`
		: '';
	const content = styles[ align ] && styles[ align ].content
		? ` style="${ styles[ align ].content }"`
		: '';

	return {
		figure,
		content
	};
};
