/**
 * External dependencies
 */
import { omit } from 'lodash';
import { Svg, Path as SvgPath } from 'react-native-svg';

/**
 * Internal dependencies
 */
import styles from '../../dashicon/style.scss';

export {
	Circle,
	G,
	Polygon,
	Rect,
} from 'react-native-svg';

export const SVG = ( props ) => {
	// We're using the react-native-classname-to-style plugin, so when a `className` prop is passed it gets converted to `style` here.
	// Given it carries a string (as it was originally className) but an object is expected for `style`,
	// we need to check whether `style` exists and is a string, and convert it to an object
	let styleKeys = new Array();
	const styleValues = new Array();
	if ( typeof props.style === 'string' || props.style instanceof String ) {
		styleKeys = props.style.split( ' ' );
		styleKeys.forEach( ( element ) => {
			const oneStyle = styles[ element ];
			if ( oneStyle !== undefined ) {
				styleValues.push( oneStyle );
			}
		} );
	}

	const safeProps = styleValues.length === 0 ? { ...omit( props, [ 'style' ] ) } : { ...props, style: styleValues };
	return (
		<Svg
			height="100%"
			width="100%"
			{ ...safeProps }
		/>
	);
};

export const Path = ( props ) => {

	return (
		<SvgPath
			fill="#3d596d"
			{ ...props }
		/>
	);
};

