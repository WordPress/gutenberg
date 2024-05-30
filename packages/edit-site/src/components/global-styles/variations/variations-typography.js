/**
 * WordPress dependencies
 */
import {
	__experimentalGrid as Grid,
	__experimentalVStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useTypographyVariations } from '../hooks';
import TypographyExample from '../typography-example';
import PreviewIframe from '../preview-iframe';
import Variation from './variation';
import Subtitle from '../subtitle';

export default function TypographyVariations( { title, gap = 2 } ) {
	const typographyVariations = useTypographyVariations();

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
				{ typographyVariations &&
					typographyVariations.length &&
					typographyVariations.map( ( variation, index ) => (
						<Variation key={ index } variation={ variation }>
							{ ( isFocused ) => (
								<PreviewIframe
									label={ variation?.title }
									isFocused={ isFocused }
								>
									{ ( { ratio, key } ) => (
										<HStack
											key={ key }
											spacing={ 10 * ratio }
											justify="center"
											style={ {
												height: '100%',
												overflow: 'hidden',
											} }
										>
											<TypographyExample
												variation={ variation }
												fontSize={ 85 * ratio }
											/>
										</HStack>
									) }
								</PreviewIframe>
							) }
						</Variation>
					) ) }
			</Grid>
		</VStack>
	);
}
