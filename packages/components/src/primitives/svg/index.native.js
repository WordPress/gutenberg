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
	const stylesFromClasses = ( props.className || '' ).split( ' ' ).map( ( element ) => styles[ element ] ).filter( Boolean );
	const styleValues = Object.assign( {}, props.style, ...stylesFromClasses );
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

