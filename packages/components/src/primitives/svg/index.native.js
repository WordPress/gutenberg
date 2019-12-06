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

export const SVG = ( { className = '', isPressed, ...props } ) => {
	const colorScheme = props.colorScheme || 'light';
	const stylesFromClasses = className.split( ' ' ).map( ( element ) => styles[ element ] ).filter( Boolean );
	const defaultStyle = isPressed ? styles[ 'is-pressed' ] : styles[ 'components-toolbar__control-' + colorScheme ];
	const styleValues = Object.assign( {}, props.style, defaultStyle, ...stylesFromClasses );

	const appliedProps = { ...props, style: styleValues };

	return (
		<Svg
			//We want to re-render when style color is changed
			key={ appliedProps.style.color }
			height="100%"
			width="100%"
			{ ...appliedProps }
		/>
	);
};

