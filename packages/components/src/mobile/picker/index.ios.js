/**
 * External dependencies
 */
import { ActionSheetIOS } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

class Picker extends Component {
	componentDidMount() {
		const { isOpen } = this.props;
		if ( isOpen ) {
			this.presentPicker();
		}
	}

	componentDidUpdate( prevProps ) {
		const { isOpen } = this.props;
		if ( ! prevProps.isOpen && isOpen ) {
			this.presentPicker();
		}
	}

	presentPicker() {
		const { options, onChange, onClose } = this.props;
		const labels = options.map( ( { label } ) => label );
		const fullOptions = [ __( 'Cancel' ) ].concat( labels );

		ActionSheetIOS.showActionSheetWithOptions(
			{
				options: fullOptions,
				cancelButtonIndex: 0,
			},
			( buttonIndex ) => {
				if ( buttonIndex === 0 ) {
					return onClose();
				}
				const selected = options[ buttonIndex - 1 ];
				onChange( selected.value );
			},
		);
	}

	render() {
		return null;
	}
}

export default Picker;
