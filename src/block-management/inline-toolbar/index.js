/** @flow
 * @format */

import React from 'react';
import { View } from 'react-native';
import InlineToolbarActions from './actions';
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

type PropsType = {
	clientId: string,
	canMoveUp: boolean,
	canMoveDown: boolean,
	onButtonPressed: ( button: number ) => void,
};

export { InlineToolbarActions };

import styles from './style.scss';

export default class InlineToolbar extends React.Component<PropsType> {
	constructor() {
		super( ...arguments );
		// Flow gets picky about reassigning methods on classes
		// https://github.com/facebook/flow/issues/1517#issuecomment-194538151
		( this: any ).onUpPressed = this.onUpPressed.bind( this );
		( this: any ).onDownPressed = this.onDownPressed.bind( this );
		( this: any ).onDeletePressed = this.onDeletePressed.bind( this );
	}

	onUpPressed() {
		this.props.onButtonPressed( InlineToolbarActions.UP );
	}

	onDownPressed() {
		this.props.onButtonPressed( InlineToolbarActions.DOWN );
	}

	onDeletePressed() {
		this.props.onButtonPressed( InlineToolbarActions.DELETE );
	}

	render() {
		return (
			<View style={ styles.toolbar }>
				<ToolbarButton
					label={ __( 'Move block up' ) }
					isDisabled={ ! this.props.canMoveUp }
					onClick={ this.onUpPressed }
					icon="arrow-up-alt"
				/>

				<ToolbarButton
					label={ __( 'Move block down' ) }
					isDisabled={ ! this.props.canMoveDown }
					onClick={ this.onDownPressed }
					icon="arrow-down-alt"
				/>

				<View style={ styles.spacer } />

				<ToolbarButton
					label={ __( 'Remove content' ) }
					onClick={ this.onDeletePressed }
					icon="trash"
				/>
			</View>
		);
	}
}
