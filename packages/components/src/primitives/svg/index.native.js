import {
	Path as PATH,
	Svg,
} from 'react-native-svg';

export const Path = PATH;
export const SVG = ( props ) => {
	return (
		<Svg width={ props.width } height={ props.height } >
			{ props.children }
		</Svg>
	);
}