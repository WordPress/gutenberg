/**
 * External dependencies
 */
import React from 'react';
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BottomSheet from '../bottom-sheet';

export default class Picker extends Component {
	constructor() {
		super( ...arguments );
		this.onClose = this.onClose.bind( this );
		this.onCellPress = this.onCellPress.bind( this );

		this.state = {
			isVisible: false,
		};
	}

	presentPicker() {
		this.setState( { isVisible: true } );
	}

	onClose() {
		this.setState( { isVisible: false } );
	}

	onCellPress( value ) {
		this.props.onChange( value );
		this.onClose();
	}

	render() {
		return (
			<BottomSheet
				isVisible={ this.state.isVisible }
				onClose={ this.onClose }
				style={ { paddingBottom: 20 } }
				hideHeader
			>
				<View>
					{ this.props.options.map( ( option, index ) =>
						<BottomSheet.Cell
							icon={ option.icon }
							key={ index }
							label={ option.label }
							separatorType={ 'none' }
							onPress={ () => this.onCellPress( option.value ) }
						/>
					) }
					{ ! this.props.hideCancelButton && <BottomSheet.Cell
						label={ __( 'Cancel' ) }
						onPress={ this.onClose }
						separatorType={ 'none' }
					/> }
				</View>
			</BottomSheet>
		);
	}
}
