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
import { BottomSheet } from '@wordpress/editor';

import styles from './styles'

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
					{ this.props.options.map( ( option, index ) => {
						const hasIcon = option.icon !== undefined;
						return (
							<BottomSheet.Cell
								icon={ option.icon }
								key={ index }
								label={ option.label }
								labelStyle={ hasIcon && styles.cellLabelWithIcon }
								separatorType={ 'none' }
								onPress={ () => this.onCellPress( option.value ) }
							/>
						)
					}
					) }
					{ ! this.props.hideCancelButton && <BottomSheet.Cell
						label={ __( 'Cancel' ) }
						onPress={ this.onClose }
						drawSeparator={ false }
					/> }
				</View>
			</BottomSheet>
		);
	}
}
