/**
 * External dependencies
 */
import { omit } from 'lodash';
import {
	Path,
	G,
	Svg,
} from 'react-native-svg';

export {
    G,
    Path,
};

export const SVG = ( props ) => {
	if ( props.width !== undefined && props.height !== undefined ) {
		return (
			<Svg { ...omit( props, [ 'className' ]) } />
		);
	}

	// take viewport system to match the viewBox definition
	// i.e. viewBox="0 0 24 24" as <Svg> needs width and height to be explicitely set
	const viewBoxCoords = props.viewBox.split( ' ' );
	return (
		<Svg { ...omit( {...props, width: viewBoxCoords[ 2 ], height: viewBoxCoords[ 3 ] }, [ 'className' ]) } />
	);
};
