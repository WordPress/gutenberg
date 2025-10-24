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
import { useCurrentMergeThemeStyleVariationsWithUserConfig } from '../hooks';
import { Subtitle } from '../subtitle';
import Variation from './variation';

interface ColorVariationsProps {
	title?: string;
	gap?: number;
}

const propertiesToFilter = [ 'color' ];

export default function ColorVariations( {
	title,
	gap = 2,
}: ColorVariationsProps ) {
	const colorVariations =
		useCurrentMergeThemeStyleVariationsWithUserConfig( propertiesToFilter );

	// Return null if there is only one variation (the default).
	if ( colorVariations?.length <= 1 ) {
		return null;
	}

	return (
		<VStack spacing={ 3 }>
			{ title && <Subtitle level={ 3 }>{ title }</Subtitle> }
			<Grid gap={ gap }>
				{ colorVariations.map( ( variation: any, index: number ) => (
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
