/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import EffectsPanel from './effects-panel';
import ScreenHeader from './header';

function ScreenEffects( { name } ) {
	const hasDimensionsPanel = true;

	return (
		<>
			<ScreenHeader title={ __( 'Effects' ) } />
			{ hasDimensionsPanel && <EffectsPanel name={ name } /> }
		</>
	);
}

export default ScreenEffects;
