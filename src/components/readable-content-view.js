/**
 * @format
 * @flow
 */

import * as React from 'react';
import { View } from 'react-native';
import styles from './readable-content-view.scss';

type PropsType = {
	children?: React.Node,
};

const ReadableContentView = ( props: PropsType ) => {
	return (
		<View style={ styles.container } >
			<View style={ styles.centeredContent } >
				{ props.children }
			</View>
		</View>
	);
};

export default ReadableContentView;
