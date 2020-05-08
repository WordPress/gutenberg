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
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BottomSheet from '../bottom-sheet';
import styles from './styles.scss';

class Picker extends Component {
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
		const { getStylesFromColorScheme } = this.props;
		const separatorStyle = getStylesFromColorScheme(
			styles.separator,
			styles.separatorDark
		);

		return (
			<BottomSheet
				isVisible={ this.state.isVisible }
				onClose={ this.onClose }
				style={ { paddingBottom: 20 } }
				hideHeader
			>
				<View>
					{ this.props.options.map( ( option, index ) => (
						<>
							{ option.separated && (
								<View style={ separatorStyle } />
							) }
							<BottomSheet.Cell
								icon={ option.icon }
								key={ index }
								leftAlign={ this.props.leftAlign }
								label={ option.label }
								separatorType={ 'none' }
								onPress={ () =>
									this.onCellPress( option.value )
								}
								disabled={ option.disabled }
							/>
						</>
					) ) }
					{ ! this.props.hideCancelButton && (
						<BottomSheet.Cell
							label={ __( 'Cancel' ) }
							onPress={ this.onClose }
							separatorType={ 'none' }
						/>
					) }
				</View>
			</BottomSheet>
		);
	}
}

export default withPreferredColorScheme( Picker );
