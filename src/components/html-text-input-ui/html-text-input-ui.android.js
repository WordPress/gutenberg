/**
 * @format
 * @flow
 */

/**
 * External dependencies
 */
import * as React from 'react';
import { ScrollView, View } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './html-text-input-ui.scss';
import KeyboardAvoidingView from '../keyboard-avoiding-view';

type PropsType = {
	parentHeight: number,
	children: React.Node,
};

type StateType = {
	contentHeight: number,
};

class HTMLInputViewUI extends React.Component<PropsType, StateType> {
	static scrollEnabled: boolean;

	constructor() {
		super( ...arguments );

		this.state = {
			contentHeight: 0,
		};
	}

	onContentSizeChange = ( event: NativeSyntheticEvent<TextInputContentSizeChangeEventData> ) => {
		this.setState( { contentHeight: event.nativeEvent.contentSize.height } );
	}

	render() {
		return (
			<KeyboardAvoidingView style={ styles.keyboardAvoidingView } parentHeight={ this.props.parentHeight }>
				<ScrollView
					style={ { flex: 1 } }
					keyboardDismissMode="interactive"
				>
					{ this.props.children }
					<View style={ { height: 16 } } />
				</ScrollView>
			</KeyboardAvoidingView>
		);
	}
}

HTMLInputViewUI.scrollEnabled = false;

export default HTMLInputViewUI;
