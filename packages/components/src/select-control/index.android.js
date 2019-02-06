/**
 * External dependencies
 */
import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import Modal from '../modal';

const CANCEL_VALUE = 'cancel';

export default class SelectControl extends Component {
	constructor() {
		super( ...arguments );
		this.onClose = this.onClose.bind( this );
		this.onCellPress = this.onCellPress.bind( this );

		this.state = {
			isVisible: false,
		};
	}

	presentSelector() {
		this.setState( { isVisible: true } );
	}

	onClose() {
		this.setState( { isVisible: false } );
	}

	onCellPress( value ) {
		if ( value !== CANCEL_VALUE ) {
			this.props.onChange( value );
		}
		this.onClose();
	}

	render() {
		const { options } = this.props;
		const fullOptions = options.concat( { label: __( 'Cancel' ), value: CANCEL_VALUE } );

		return (
			<Modal
				title={ __( 'Image Alt Text' ) }
				isVisible={ this.state.isVisible }
				onClose={ this.onClose }
			>
				<View style={ { flex: 1 } }>
					{ fullOptions.map( ( option, index ) =>
						<TouchableOpacity
							style={ styles.cellContainer }
							onPress={ () => this.onCellPress( option.value ) }
							key={ index }
						>
							<Text style={ styles.cellLabel } numberOfLines={ 1 } >
								{ option.label }
							</Text>
						</TouchableOpacity>
					) }
				</View>
			</Modal>
		);
	}
}
