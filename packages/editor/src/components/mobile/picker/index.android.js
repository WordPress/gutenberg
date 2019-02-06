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
import { BottomSheet } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import styles from './styles';

const CANCEL_VALUE = 'cancel';

export default class Picker extends Component {
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
		return (
			<BottomSheet
				isVisible={ this.state.isVisible }
				onClose={ this.onClose }
				hideHeader
			>
				<View>
					{ this.props.options.map( ( option, index ) =>
						<BottomSheet.Cell 
							key={ index }
							label={ option.label }
							onPress={ () => this.onCellPress( option.value ) }
						/>
					) }
					<BottomSheet.Cell 
						label={ __( 'Cancel' ) }
						onPress={ this.onClose }
						drawSeparator={ false }
					/>
				</View>
			</BottomSheet>
		);
	}
}
