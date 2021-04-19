/**
 * External dependencies
 */
import { TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const EmbedPlaceholder = ( { value } ) => {
	return (
		<TextInput
			value={ value }
			placeholder={ __( 'Enter URL to embed here…' ) }
		/>
	);
};

export default EmbedPlaceholder;
