/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import InspectorControls from '../inspector-controls';

const BlockInspectorActions = {
	UP: 1,
	DOWN: 2,
	DELETE: 3,
};

export { BlockInspectorActions };

export default class BlockInspector extends Component {
	constructor( ...args ) {
		super( ...args );

		this.onUpPressed = this.onUpPressed.bind( this );
		this.onDownPressed = this.onDownPressed.bind( this );
		this.onDeletePressed = this.onDeletePressed.bind( this );
	}

	onUpPressed() {
		this.props.onButtonPressed( BlockInspectorActions.UP );
	}

	onDownPressed() {
		this.props.onButtonPressed( BlockInspectorActions.DOWN );
	}

	onDeletePressed() {
		this.props.onButtonPressed( BlockInspectorActions.DELETE );
	}

	render() {
		return (
			<View style={ styles.toolbar }>
				<ToolbarButton
					label={ __( 'Move up' ) }
					isDisabled={ ! this.props.canMoveUp }
					onClick={ this.onUpPressed }
					icon="arrow-up-alt"
				/>

				<ToolbarButton
					label={ __( 'Move down' ) }
					isDisabled={ ! this.props.canMoveDown }
					onClick={ this.onDownPressed }
					icon="arrow-down-alt"
				/>

				<View style={ styles.spacer } />

				<InspectorControls.Slot />

				<ToolbarButton
					label={ __( 'Remove' ) }
					onClick={ this.onDeletePressed }
					icon="trash"
				/>
			</View>
		);
	}
}
