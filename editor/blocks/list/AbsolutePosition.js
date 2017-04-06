
const AbsolutePosition = ( { top, left, extraStyles = {}, children } ) => (
	<div role="presentation"
		style={ {
			position: 'absolute',
			top,
			left,
			...extraStyles
		} }>
		{ children }
	</div>
);

export default AbsolutePosition;

AbsolutePosition.propTypes = {
	top: wp.element.PropTypes.number.isRequired,
	left: wp.element.PropTypes.number.isRequired,
	extraStyles: wp.element.PropTypes.object
};
