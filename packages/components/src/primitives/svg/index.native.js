/**
 * External dependencies
 */
import { omit } from 'lodash';
import { Svg } from 'react-native-svg';

const SVG = ( props ) => {
	// TODO: Allow style only when it is valid object.
	const appliedProps = omit( props, [ 'className', 'style' ] );

	return (
		<Svg
			height="100%"
			width="100%"
			{ ...appliedProps }
		/>
	);
};

export default SVG;
