/**
 * External dependencies
 */
import { ActionSheetIOS } from 'react-native';
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

class SelectControl extends Component {
	presentSelector() {
		const  { options, onChange } = this.props;
		const labels = options.map( ( { label } ) => label );
		const fullOptions = [ __( "Cancel" ) ].concat( labels );

		ActionSheetIOS.showActionSheetWithOptions( {
				options: fullOptions,
				cancelButtonIndex: 0,
			},
			(buttonIndex) => {
				if (buttonIndex == 0) {
					return;
				}
				const selected = options[buttonIndex - 1];
				onChange( selected.value );
			},
		);
	}

	render() {
		return null;
	}
}

export default SelectControl;
