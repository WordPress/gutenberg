import {
	Path as PATH,
	G as GROUP,
	Svg,
} from 'react-native-svg';

export const Path = PATH;
export const G = GROUP;
export const SVG = ( props ) => {
	return (
		<Svg width={ props.width } height={ props.height } >
			{ props.children }
		</Svg>
	);
};