/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import BorderPanel, { useHasBorderPanel } from './border-panel';

function ScreenEffects( { name } ) {
	const hasBorderPanel = useHasBorderPanel( name );

	return (
		<>
			<ScreenHeader title={ __( 'Border' ) } />
			{ hasBorderPanel && <BorderPanel name={ name } /> }
		</>
	);
}

export default ScreenEffects;
