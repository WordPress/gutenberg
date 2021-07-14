/**
 * External dependencies
 */
import classnames from 'classnames';

const ColorIndicator = ( {
	className,
	colorValue,
	circular = false,
	...props
} ) => (
	<span
		className={ classnames(
			'component-color-indicator',
			{ 'is-circular': circular },
			className
		) }
		style={ { background: colorValue } }
		{ ...props }
	/>
);

export default ColorIndicator;
