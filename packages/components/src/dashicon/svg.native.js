import Svg,{ Path } from 'react-native-svg';

export default function SVG( props, ref ) {
    const { size, path, iconClass } = props
    return (
        <Svg height={ size } width={ size }>        
            <Path d={ path } />
        </Svg>
    );
}