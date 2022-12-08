/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Subtitle from './subtitle';
import CustomCSSControl from './custom-css';

function ScreenCSS() {
	return (
		<>
			<ScreenHeader
				title={ __( 'CSS' ) }
				description={ __(
					'Add CSS beyond the styles offered by the existing design tools.'
				) }
			/>
			<div className="edit-site-global-styles-screen-css">
				<VStack spacing={ 3 }>
					<Subtitle>{ __( 'ADDITIONAL CSS' ) }</Subtitle>
					<CustomCSSControl />
				</VStack>
			</div>
		</>
	);
}

export default ScreenCSS;
