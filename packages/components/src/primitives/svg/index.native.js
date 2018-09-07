/**
 * External dependencies
 */
import { omit } from 'lodash';
import { Svg } from 'react-native-svg';

const SVG = ( props ) => {
	const appliedProps = omit( props, 'className' );

	return <Svg { ...appliedProps } />;
};

export default SVG;
