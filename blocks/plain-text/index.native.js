/**
 * External dependencies
 */
import { TextInput } from 'react-native';
import classnames from 'classnames';

/**
 * Internal dependencies
 */

function PlainText( { onChange, className, ...props } ) {
	return (
		<TextInput
			className={ classnames( 'blocks-plain-text', className ) }
			onChangeText={ ( text ) => onChange( text ) }
			{ ...props }
		/>
	);
}

export default PlainText;
