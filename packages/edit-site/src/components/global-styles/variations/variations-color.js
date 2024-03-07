/**
 * WordPress dependencies
 */
import {
	__experimentalGrid as Grid,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Subtitle from '../subtitle';
import Variation from './variation';
import StylesPreviewColors from '../preview-colors';
import { useCurrentMergeThemeStyleVariationsWithUserConfig } from '../../../hooks/use-theme-style-variations/use-theme-style-variations-by-property';

export default function ColorVariations() {
	const colorVariations = useCurrentMergeThemeStyleVariationsWithUserConfig( {
		property: 'color',
		filter: ( variation ) =>
			variation?.settings?.color &&
			Object.keys( variation?.settings?.color ).length,
	} );

	if ( ! colorVariations?.length ) {
		return null;
	}

	return (
		<VStack spacing={ 3 }>
			<Subtitle level={ 3 }>{ __( 'Presets' ) }</Subtitle>
			<Grid columns={ 3 }>
				{ colorVariations.map( ( variation, index ) => (
					<Variation key={ index } variation={ variation }>
						{ () => <StylesPreviewColors /> }
					</Variation>
				) ) }
			</Grid>
		</VStack>
	);
}
