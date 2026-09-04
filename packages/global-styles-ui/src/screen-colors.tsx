import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { ScreenHeader } from './screen-header';
import { ScreenBody } from './screen-body';
import Palette from './palette';

function ScreenColors() {
	return (
		<>
			<ScreenHeader
				title={ __( 'Colors' ) }
				description={ __(
					'Manage the color palettes used on the site.'
				) }
			/>
			<ScreenBody>
				<VStack spacing={ 7 }>
					<Palette />
				</VStack>
			</ScreenBody>
		</>
	);
}

export default ScreenColors;
