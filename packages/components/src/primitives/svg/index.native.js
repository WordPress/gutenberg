/**
 * External dependencies
 */
import { Svg } from 'react-native-svg';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export {
	Circle,
	G,
	Path,
	Polygon,
	Rect,
} from 'react-native-svg';

export const SVG = ( props ) => {
	// We're using the react-native-classname-to-style plugin, so when a `className` prop is passed it gets converted to `style` here.
	// Given it carries a string (as it was originally className) but an object is expected for `style`,
	// we need to check whether `style` exists and is a string, and convert it to an object

	let style = {};
	if ( typeof props.style === 'string' ) {
		const oneStyle = props.style.split( ' ' ).map( ( element ) => styles[ element ] ).filter( Boolean );
		style = Object.assign( style, ...oneStyle );
	} else {
		style = props.style;
	}

	const safeProps = { ...props, style };

	return (
		<Svg
			//We want to re-render when style color is changed
			key={ safeProps.style.color }
			height="100%"
			width="100%"
			{ ...safeProps }
		/>
	);
};

