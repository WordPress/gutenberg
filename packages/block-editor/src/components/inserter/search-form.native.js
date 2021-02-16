/**
 * External dependencies
 */
import { TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';

function InserterSearchForm( { value, onChange } ) {
	const searchFormStyle = usePreferredColorSchemeStyle(
		styles.searchForm,
		styles.searchFormDark
	);

	const placeholderStyle = usePreferredColorSchemeStyle(
		styles.searchFormPlaceholder,
		styles.searchFormPlaceholderDark
	);

	return (
		<TextInput
			placeholderTextColor={ placeholderStyle.color }
			style={ searchFormStyle }
			onChangeText={ onChange }
			value={ value }
			placeholder={ __( 'Search blocks' ) }
		/>
	);
}

export default InserterSearchForm;
