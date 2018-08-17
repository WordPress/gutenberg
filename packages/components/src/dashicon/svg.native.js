import Svg from 'react-native-svg';

export default ( props ) => (
	<Svg width={ props.width } height={ props.height } >
		{ props.children }
	</Svg>
);
