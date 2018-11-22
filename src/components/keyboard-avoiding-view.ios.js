/**
* @format
* @flow
*/

import React from 'react';

import { View, NativeModules, KeyboardAvoidingView as IOSKeyboardAvoidingView } from 'react-native';
const { StatusBarManager } = NativeModules;

type StateType = {
	statusBarHeight: number;
};

type PropsType = {
	...View.propTypes,
}

export default class KeyboardAvoidingView extends React.Component <PropsType, StateType> {
	constructor( props: PropsType ) {
		super( props );

		this.state = {
			statusBarHeight: 0,
		};
	}

	componentDidMount() {
		// Due to missing of mocked getHeight() method, our tests would fail
		// https://github.com/facebook/react-native/blob/master/jest/setup.js#L228
		// so in order to temporary fix this problem, additional check is added
		// We have raised an issue https://github.com/facebook/react-native/issues/22385
		if ( typeof StatusBarManager.getHeight === 'function' ) {
			StatusBarManager.getHeight( ( statusBarFrameData ) => {
				this.setState( { statusBarHeight: statusBarFrameData.height } );
			} );
		}
	}

	render() {
		const behavior = 'padding';
		const keyboardVerticalOffset = this.state.statusBarHeight + 44;

		return (
			<IOSKeyboardAvoidingView { ...this.props } behavior={ behavior } keyboardVerticalOffset={ keyboardVerticalOffset } />
		);
	}
}
