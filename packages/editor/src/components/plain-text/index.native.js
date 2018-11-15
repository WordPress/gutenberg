/**
 * External dependencies
 */
import { TextInput } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './style.scss';

function PlainText( { onChange, className, ...props } ) {
	if (props.isSelected === true) {
		setTimeout(() => this._input.focus(), 250);
	}
	return (
		<TextInput
			ref={(x) => this._input = x}
			className={ [ styles[ 'editor-plain-text' ], className ] }
			onChangeText={ ( text ) => onChange( text ) }
			{ ...props }
		/>
	);
}

export default PlainText;
