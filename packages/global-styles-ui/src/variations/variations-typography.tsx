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
import StylesPreviewTypography from '../preview-typography';
import { useCurrentMergeThemeStyleVariationsWithUserConfig } from '../hooks';
import { Subtitle } from '../subtitle';
import Variation from './variation';

interface TypographyVariationsProps {
	title?: string;
	gap?: number;
}

const propertiesToFilter = [ 'typography' ];

export default function TypographyVariations( {
	title,
	gap = 2,
}: TypographyVariationsProps ) {
	const typographyVariations =
		useCurrentMergeThemeStyleVariationsWithUserConfig( propertiesToFilter );

	// Return null if there is only one variation (the default).
	if ( typographyVariations?.length <= 1 ) {
		return null;
	}

	return (
		<VStack spacing={ 3 }>
			{ title && <Subtitle level={ 3 }>{ title }</Subtitle> }
			<Grid
				columns={ 3 }
				gap={ gap }
				className="global-styles-ui-style-variations-container"
			>
				{ typographyVariations.map(
					( variation: any, index: number ) => {
						return (
							<Variation
								key={ index }
								variation={ variation }
								properties={ propertiesToFilter }
								showTooltip
							>
								{ () => (
									<StylesPreviewTypography
										variation={ variation }
									/>
								) }
							</Variation>
						);
					}
				) }
			</Grid>
		</VStack>
	);
}
