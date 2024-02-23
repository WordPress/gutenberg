/**
 * WordPress dependencies
 */
import {
	__experimentalGrid as Grid,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalZStack as ZStack,
	ColorIndicator,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ColorIndicatorWrapper from './color-indicator-wrapper';
import Subtitle from './subtitle';
import Variation from './variation';

export default function ColorVariations( { variations } ) {
	return (
		<VStack spacing={ 3 }>
			<Subtitle level={ 3 }>{ __( 'Presets' ) }</Subtitle>
			<Grid
				columns={ 2 }
				className="edit-site-global-styles-color-variations"
			>
				{ variations.map( ( variation, index ) => (
					<Variation key={ index } variation={ variation }>
						{ () => {
							const colors =
								variation?.settings?.color?.palette?.theme ??
								[];
							return (
								<HStack
									direction={
										colors.length === 0
											? 'row-reverse'
											: 'row'
									}
									justify="center"
								>
									<ZStack isLayered={ false } offset={ -8 }>
										{ colors
											.slice( 0, 5 )
											.map( ( { color }, colorIndex ) => (
												<ColorIndicatorWrapper
													key={ `${ color }-${ colorIndex }` }
												>
													<ColorIndicator
														colorValue={ color }
													/>
												</ColorIndicatorWrapper>
											) ) }
									</ZStack>
								</HStack>
							);
						} }
					</Variation>
				) ) }
			</Grid>
		</VStack>
	);
}
