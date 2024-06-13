/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import TypographyVariations from './variations/variations-typography';
import ScreenHeader from './header';
import Typeset from './typeset';

function ScreenTypeset() {
	return (
		<>
			<ScreenHeader
				title={ __( 'Typesets' ) }
				description={ __(
					'Font pairings and typographic styling applied across the site.'
				) }
			/>
			<div className="edit-site-global-styles-screen">
				<VStack spacing={ 7 }>
					<Typeset />
					<TypographyVariations title={ __( 'Presets' ) } />
				</VStack>
			</div>
		</>
	);
}

export default ScreenTypeset;
