/**
 * @format
 * @flow
 */

/**
 * External dependencies
 */
import * as React from 'react';
import { ScrollView } from 'react-native';

/**
 * WordPress dependencies
 */
import { KeyboardAvoidingView } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './html-text-input-ui.scss';

type PropsType = {
	parentHeight: number,
	children: React.Node,
};

type StateType = {
};

class HTMLInputContainer extends React.Component<PropsType, StateType> {
	static scrollEnabled: boolean;

	render() {
		return (
			<KeyboardAvoidingView style={ styles.keyboardAvoidingView } parentHeight={ this.props.parentHeight }>
				<ScrollView style={ styles.scrollView } >
					{ this.props.children }
				</ScrollView>
			</KeyboardAvoidingView>
		);
	}
}

HTMLInputContainer.scrollEnabled = false;

export default HTMLInputContainer;
