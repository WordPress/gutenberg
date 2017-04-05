
export default function AbsolutePosition( { top, left, extraStyles = {}, children } ) {
	const style = {
		position: 'absolute',
		top,
		left,
		...extraStyles
	};
    // console.log('>AbsPos', style)

	return (
		<div style={ style }>
			{ children }
		</div>
	);
}

AbsolutePosition.propTypes = {
	top: wp.element.PropTypes.number,
	left: wp.element.PropTypes.number,
	extraStyles: wp.element.PropTypes.object,
  // closePortal: wp.element.PropTypes.func,
};
