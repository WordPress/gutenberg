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
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BottomSheet from '../bottom-sheet';
import styles from './styles.scss';

function Separator() {
	const separatorStyle = usePreferredColorSchemeStyle(
		styles.separator,
		styles.separatorDark
	);

	return <View style={ separatorStyle } />;
}

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
		const { onChange } = this.props;
		onChange( value );
		this.onClose();
	}

	render() {
		const { options, leftAlign, hideCancelButton, title } = this.props;
		const { isVisible } = this.state;

		return (
			<BottomSheet
				isVisible={ isVisible }
				onClose={ this.onClose }
				style={ { paddingBottom: 20 } }
				hideHeader={ ! title }
				title={ title }
			>
				<View>
					{ options.map( ( option, index ) => (
						<>
							{ options.length > 1 && option.separated && (
								<Separator />
							) }
							<BottomSheet.Cell
								icon={ option.icon }
								key={ index }
								leftAlign={ leftAlign }
								label={ option.label }
								separatorType={ 'none' }
								onPress={ () =>
									this.onCellPress( option.value )
								}
								disabled={ option.disabled }
								style={ option.disabled && styles.disabled }
							/>
						</>
					) ) }
					{ ! hideCancelButton && (
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
