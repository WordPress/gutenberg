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
import { useCurrentMergeThemeStyleVariationsWithUserConfig } from '../../../hooks/use-theme-style-variations/use-theme-style-variations-by-property';
import Subtitle from '../subtitle';
import Variation from './variation';

export default function TypographyVariations( { title, gap = 2 } ) {
	const propertiesToFilter = [ 'typography' ];
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
				className="edit-site-global-styles-style-variations-container"
			>
				{ typographyVariations.map( ( variation, index ) => {
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
				} ) }
			</Grid>
		</VStack>
	);
}
