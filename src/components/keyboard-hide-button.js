/**
 * @format
 * @flow
 */

import React from 'react';
import Svg, { G, Rect, Path } from 'react-native-svg';
import { TouchableOpacity } from 'react-native';

const KeyboardHideButton = ( props ) => (
	<TouchableOpacity
		style={ { justifyContent: 'center', alignItems: 'center', width: 44 } }
		onPress={ props.onPress }
	>
		<Svg width={ 20 } height={ 20 } >
			<G fillRule="nonzero" fill="none">
				<Rect fill="#7b9ab1" width={ 20 } height={ 14 } rx={ 2 } />
				<Path fill="#FFF" d="M2 2h16v10H2z" />
				<Path
					fill="#7b9ab1"
					d="M3 3h2v2H3zM6 3h2v2H6zM9 3h2v2H9zM12 3h2v2h-2zM15 3h2v2h-2zM3 6h2v2H3zM5 9h9v2H5zM6 6h2v2H6zM9 6h2v2H9zM12 6h2v2h-2zM15 6h2v2h-2zM10 20l4-4H6z"
				/>
			</G>
		</Svg>
	</TouchableOpacity>
);

export default KeyboardHideButton;
