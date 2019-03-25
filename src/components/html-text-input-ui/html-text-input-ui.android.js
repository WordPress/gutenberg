/**
 * @format
 * @flow
 */

/**
 * External dependencies
 */
import * as React from 'react';
import { ScrollView, NativeSyntheticEvent, TextInputContentSizeChangeEventData } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './html-text-input-ui.scss';
import KeyboardAvoidingView from '../keyboard-avoiding-view';

type PropsType = {
	parentHeight: number,
	content: (
		scrollEnabled: boolean,
		style: mixed,
		onContentSizeChange: ( NativeSyntheticEvent<TextInputContentSizeChangeEventData> ) => void ) => React.Node,
};

type StateType = {
	contentHeight: number,
};

export default class HTMLInputViewUI extends React.Component<PropsType, StateType> {
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
		const style = { ...styles.htmlView, height: this.state.contentHeight + 16 };
		return (
			<KeyboardAvoidingView style={ styles.keyboardAvoidingView } parentHeight={ this.props.parentHeight }>
				<ScrollView
					style={ { flex: 1 } }
					keyboardDismissMode="interactive"
				>
					{ this.props.content( false, style, this.onContentSizeChange ) }
				</ScrollView>
			</KeyboardAvoidingView>
		);
	}
}
