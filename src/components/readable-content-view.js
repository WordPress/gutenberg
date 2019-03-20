/**
 * @format
 * @flow
 */

import * as React from 'react';
import { View, Dimensions } from 'react-native';
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

const isContentMaxWidth = (): boolean => {
	const { width } = Dimensions.get( 'window' );
	return width > styles.centeredContent.maxWidth;
};

ReadableContentView.isContentMaxWidth = isContentMaxWidth;
export default ReadableContentView;
