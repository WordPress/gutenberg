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
	const colorScheme = props.colorScheme || 'light';
	const stylesFromClasses = ( props.className || '' ).split( ' ' ).map( ( element ) => styles[ element ] ).filter( Boolean );
	const defaultStyle = props.active ? styles[ 'is-active' ] : styles[ 'components-toolbar__control-' + colorScheme ];
	const styleValues = Object.assign( {}, props.style, defaultStyle, ...stylesFromClasses );

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

