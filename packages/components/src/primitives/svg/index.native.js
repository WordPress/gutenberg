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
	let styleValues = {};
	if ( typeof props.className === 'string' ) {
		const oneStyle = props.className.split( ' ' ).map( ( element ) => styles[ element ] ).filter( Boolean );
		styleValues = Object.assign( styleValues, ...oneStyle );
	}

	const safeProps = { ...props, style: styleValues };

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

