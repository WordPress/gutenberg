/**
 * External dependencies
 */
import { omit } from 'lodash';
import { Svg } from 'react-native-svg';

export const SVG = ( props ) => {
	const appliedProps = omit( props, 'className' );

	return <Svg { ...appliedProps } />;
};

export {
	G,
	Path,
	Polygon,
} from 'react-native-svg';
