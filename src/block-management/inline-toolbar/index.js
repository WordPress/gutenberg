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
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
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
	canMoveUp: boolean,
	canMoveDown: boolean,
	onButtonPressed: ( button: number ) => void,
	order: number,
};

export class InlineToolbar extends React.Component<PropsType> {
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
		const { order } = this.props;
		let moveUpButtonTitle = `Move up from row ${ order }`;
		if ( this.props.canMoveUp ) {
			moveUpButtonTitle += ` to row ${ order - 1 }`;
		}

		let moveDownButtonTitle = `Move down from row ${ order }`;
		if ( this.props.canMoveDown ) {
			moveDownButtonTitle += ` to row ${ order + 1 }`;
		}

		const removeButtonTitle = `Remove row ${ order }`;

		return (
			<View style={ styles.toolbar } >
				<ToolbarButton
					title={ __( moveUpButtonTitle ) }
					isDisabled={ ! this.props.canMoveUp }
					onClick={ this.onUpPressed }
					icon="arrow-up-alt"
				/>

				<ToolbarButton
					title={ __( moveDownButtonTitle ) }
					isDisabled={ ! this.props.canMoveDown }
					onClick={ this.onDownPressed }
					icon="arrow-down-alt"
				/>

				<View style={ styles.spacer } />

				<InspectorControls.Slot />

				<ToolbarButton
					title={ __( removeButtonTitle ) }
					onClick={ this.onDeletePressed }
					icon="trash"
				/>
			</View>
		);
	}
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockIndex,
		} = select( 'core/block-editor' );

		return {
			order: getBlockIndex( clientId ) + 1,
		};
	} ),
] )( InlineToolbar );
