/**
 * WordPress dependencies
 */
import {
	__experimentalGrid as Grid,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import Variation from './variation';
import StylesPreviewColors from '../preview-colors';
import { useCurrentMergeThemeStyleVariationsWithUserConfig } from '../../../hooks/use-theme-style-variations/use-theme-style-variations-by-property';

export default function ColorVariations() {
	const colorVariations = useCurrentMergeThemeStyleVariationsWithUserConfig( {
		property: 'color',
	} );

	if ( ! colorVariations?.length ) {
		return null;
	}

	return (
		<VStack spacing={ 3 }>
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
