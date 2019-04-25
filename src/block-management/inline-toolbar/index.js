/** @flow
 * @format */

/**
 * External dependencies
 */
import React from 'react';
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import InlineToolbarActions from './actions';

export { InlineToolbarActions };

type PropsType = {
	clientId: string,
	canMoveUp: boolean,
	canMoveDown: boolean,
	onButtonPressed: ( button: number ) => void,
};

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
			<View style={ styles.toolbar } >
				<ToolbarButton
					accessibilityLabel={ __( 'Move up' ) }
					title={ __( 'Move up' ) }
					isDisabled={ ! this.props.canMoveUp }
					onClick={ this.onUpPressed }
					icon="arrow-up-alt"
					extraProps={ { hint: __( 'Double tap to move the block up' ) } }
				/>

				<ToolbarButton
					title={ __( 'Move down' ) }
					isDisabled={ ! this.props.canMoveDown }
					onClick={ this.onDownPressed }
					icon="arrow-down-alt"
					extraProps={ { hint: __( 'Double tap to move the block down' ) } }
				/>

				<View style={ styles.spacer } />

				<InspectorControls.Slot />

				<ToolbarButton
					title={ __( 'Remove' ) }
					onClick={ this.onDeletePressed }
					icon="trash"
					extraProps={ { hint: __( 'Double tap to remove the block' ) } }
				/>
			</View>
		);
	}
}
