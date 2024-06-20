/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalGrid as Grid,
	Tooltip,
} from '@wordpress/components';

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
			<Grid spacing={ gap }>
				{ colorVariations.map( ( variation, index ) => (
					<Tooltip key={ index } text={ variation?.title }>
						{ /* This div is needed for Tooltips to work */ }
						<div>
							<Variation
								variation={ variation }
								isPill
								property="color"
							>
								{ () => <StylesPreviewColors /> }
							</Variation>
						</div>
					</Tooltip>
				) ) }
			</Grid>
		</VStack>
	);
}
