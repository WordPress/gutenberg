/**
 * External dependencies
 */
import { omit } from 'lodash';
import {
	Path,
	G,
	Svg,
} from 'react-native-svg';

/**
 * Internal dependencies
 */
import styles from '../../dashicon/style.scss';

export {
	G,
	Path,
};

export const SVG = ( props ) => {
	// We're using the react-native-classname-to-style plugin, so when a `className` prop is passed it gets converted to `style` here.
	// Given it carries a string (as it was originally className) but an object is expected for `style`,
	// we need to check whether `style` exists and is a string, and convert it to an object
	let styleKeys = new Array();
	let styleValues = new Array();
	if ( typeof props.style === 'string' || props.style instanceof String ) {
		styleKeys = props.style.split( ' ' );
		styleKeys.forEach(element => {
			let oneStyle = styles[ styleKeys[ element ] ];
			if ( oneStyle != undefined ) {
				styleValues.push( styles[ styleKeys[ element ] ] );
			}
		});
	}

	const safeProps = styleValues.length == 0 ? { ...omit( props, [ 'style' ] ) } : { ...props, style: styleValues };
	if ( safeProps.width !== undefined && safeProps.height !== undefined ) {
		return (
			<Svg { ...safeProps } />
		);
	}

	// take viewport system to match the viewBox definition
	// i.e. viewBox="0 0 24 24" as <Svg> needs width and height to be explicitely set
	const viewBoxCoords = props.viewBox.split( ' ' );
	return (
		<Svg { ...{ ...safeProps, width: viewBoxCoords[ 2 ], height: viewBoxCoords[ 3 ] } } />
	);
};
