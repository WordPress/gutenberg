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
import { useColorVariations } from '../hooks';
import Subtitle from '../subtitle';

export default function ColorVariations( { title, gap = 2 } ) {
	const colorVariations = useColorVariations();

	if ( ! colorVariations?.length ) {
		return null;
	}

	return (
		<VStack spacing={ 3 }>
			{ title && <Subtitle level={ 3 }>{ title }</Subtitle> }
			<Grid columns={ 3 } gap={ gap }>
				{ colorVariations.map( ( variation, index ) => (
					<Variation key={ index } variation={ variation }>
						{ () => <StylesPreviewColors /> }
					</Variation>
				) ) }
			</Grid>
		</VStack>
	);
}
