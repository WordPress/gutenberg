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

export default function ColorVariations( { variations } ) {
	return (
		<VStack spacing={ 3 }>
			<Grid columns={ 3 }>
				{ variations.map( ( variation, index ) => (
					<Variation key={ index } variation={ variation }>
						{ () => <StylesPreviewColors /> }
					</Variation>
				) ) }
			</Grid>
		</VStack>
	);
}
