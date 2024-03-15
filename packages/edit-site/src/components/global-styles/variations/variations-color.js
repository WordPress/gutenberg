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
import { useUniqueColorVariations } from '../hooks';

export default function ColorVariations() {
	const colorVariations = useUniqueColorVariations();

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
