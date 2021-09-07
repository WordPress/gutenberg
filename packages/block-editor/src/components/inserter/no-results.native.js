/**
 * External dependencies
 */
import { View, Text, useColorScheme } from 'react-native';

/**
 * WordPress dependencies
 */
import { useModifiedStyle } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import baseStyles from './style.scss';

function InserterNoResults() {
	const isDark = useColorScheme() === 'dark';
	const styles = useModifiedStyle( baseStyles, {
		dark: [ isDark ],
	} );
	const {
		'inserter-search-no-results__container': containerStyle,
		'inserter-search-no-results__text-primary': textPrimaryStyle,
		'inserter-search-no-results__text-secondary': textSecondaryStyle,
	} = styles;

	return (
		<View>
			<View style={ containerStyle }>
				<Text style={ textPrimaryStyle }>
					{ __( 'No blocks found' ) }
				</Text>
				<Text style={ textSecondaryStyle }>
					{ __( 'Try another search term' ) }
				</Text>
			</View>
		</View>
	);
}

export default InserterNoResults;
