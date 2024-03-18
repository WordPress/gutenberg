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
import { useUniqueTypographyVariations } from '../hooks';
import TypographyExample from '../typography-example';
import PreviewIframe from '../preview-iframe';
import Variation from './variation';

export default function TypographyVariations() {
	const typographyVariations = useUniqueTypographyVariations();

	if ( ! typographyVariations?.length ) {
		return null;
	}

	return (
		<VStack spacing={ 3 }>
			<Grid
				columns={ 3 }
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
