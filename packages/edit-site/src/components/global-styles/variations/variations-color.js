/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import StylesPreviewColors from '../preview-colors';
import { useColorVariations } from '../hooks';
import Subtitle from '../subtitle';
import Variation from './variation';

export default function ColorVariations( { title, gap = 2 } ) {
	const colorVariations = useColorVariations();

	// Return null if there is only one variation (the default).
	if ( colorVariations?.length <= 1 ) {
		return null;
	}

	return (
		<VStack spacing={ 3 }>
			{ title && <Subtitle level={ 3 }>{ title }</Subtitle> }
			<VStack spacing={ gap }>
				{ colorVariations.map( ( variation, index ) => (
					<Variation key={ index } variation={ variation } isPill>
						{ () => <StylesPreviewColors /> }
					</Variation>
				) ) }
			</VStack>
		</VStack>
	);
}
