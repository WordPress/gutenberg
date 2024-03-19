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
import { useColorVariations } from '../hooks';

export default function ColorVariations() {
	const colorVariations = useColorVariations();

	if ( ! colorVariations?.length ) {
		return null;
	}

	return (
		<VStack spacing={ 3 }>
			<Subtitle level={ 3 }>{ __( 'Presets' ) }</Subtitle>
			<Grid columns={ 3 } gap={ 2 }>
				{ colorVariations.map( ( variation, index ) => (
					<Variation key={ index } variation={ variation }>
						{ () => <StylesPreviewColors /> }
					</Variation>
				) ) }
			</Grid>
		</VStack>
	);
}
