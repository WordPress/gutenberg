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
import StylesPreviewColors from '../preview-colors';
import { useCurrentMergeThemeStyleVariationsWithUserConfig } from '../../../hooks/use-theme-style-variations/use-theme-style-variations-by-property';
import Subtitle from '../subtitle';
import Variation from './variation';

export default function ColorVariations( { title, gap = 2 } ) {
	const propertiesToFilter = [ 'color' ];
	const colorVariations =
		useCurrentMergeThemeStyleVariationsWithUserConfig( propertiesToFilter );

	// Return null if there is only one variation (the default).
	if ( colorVariations?.length <= 1 ) {
		return null;
	}

	return (
		<VStack spacing={ 3 }>
			{ title && <Subtitle level={ 3 }>{ title }</Subtitle> }
			<Grid spacing={ gap }>
				{ colorVariations.map( ( variation, index ) => (
					<Variation
						key={ index }
						variation={ variation }
						isPill
						properties={ propertiesToFilter }
						showTooltip
					>
						{ () => <StylesPreviewColors /> }
					</Variation>
				) ) }
			</Grid>
		</VStack>
	);
}
