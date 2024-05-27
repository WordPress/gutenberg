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

	if ( ! colorVariations?.length ) {
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
