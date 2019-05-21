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
import { __, sprintf } from '@wordpress/i18n';
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
		const moveUpButtonTitle = this.props.canMoveUp ? sprintf(
			/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
			__( 'Move block up from row %1$s to row %2$s' ),
			order,
			order - 1 ) : __( 'Move block up' );

		const moveDownButtonTitle = this.props.canMoveUp ? sprintf(
			/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
			__( 'Move block down from row %1$s to row %2$s' ),
			order,
			order + 1 ) : __( 'Move block down' );

		const removeButtonTitle = sprintf(
			/* translators: accessibility text. %s: current block position (number). */
			__( 'Remove block at row %s' ),
			order );

		return (
			<View style={ styles.toolbar } >
				<ToolbarButton
					title={ __( moveUpButtonTitle ) }
					isDisabled={ ! this.props.canMoveUp }
					onClick={ this.onUpPressed }
					icon="arrow-up-alt"
					extraProps={ { hint: __( 'Double tap to move the block up' ) } }
				/>

				<ToolbarButton
					title={ __( moveDownButtonTitle ) }
					isDisabled={ ! this.props.canMoveDown }
					onClick={ this.onDownPressed }
					icon="arrow-down-alt"
					extraProps={ { hint: __( 'Double tap to move the block down' ) } }
				/>

				<View style={ styles.spacer } />

				<InspectorControls.Slot />

				<ToolbarButton
					title={ __( removeButtonTitle ) }
					onClick={ this.onDeletePressed }
					icon="trash"
					extraProps={ { hint: __( 'Double tap to remove the block' ) } }
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
