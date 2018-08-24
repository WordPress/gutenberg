import {
	Path as PATH,
	G as GROUP,
	Svg,
} from 'react-native-svg';

export const Path = PATH;
export const G = GROUP;
export const SVG = ( props ) => {
	if (props.width != undefined && props.height != undefined) {
		return (
			<Svg width={ props.width } height={ props.height } >
				{ props.children }
			</Svg>
		);
	} else {
		// take viewport system to match the viewBox definition
		// i.e. viewBox="0 0 24 24"
		let viewBoxCoords = props.viewBox.split(' ');
		return (
			<Svg width={ viewBoxCoords[2] } height={ viewBoxCoords[3] } >
				{ props.children }
			</Svg>
		);
	}
};
