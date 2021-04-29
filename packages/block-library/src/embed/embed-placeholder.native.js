/**
 * External dependencies
 */
import { TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import EmbedBottomSheet from './embed-bottom-sheet';

const EmbedPlaceholder = ( { value } ) => {
	return (
		<>
			<TextInput
				value={ value }
				placeholder={ __( 'Enter URL to embed here…' ) }
			/>
			<EmbedBottomSheet
				value={ value }
				onClose={ () => {
					// TODO:
				} }
			/>
		</>
	);
};

export default EmbedPlaceholder;
