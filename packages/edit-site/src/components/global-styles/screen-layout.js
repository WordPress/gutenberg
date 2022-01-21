/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BorderPanel, { useHasBorderPanel } from './border-panel';
import DimensionsPanel, { useHasDimensionsPanel } from './dimensions-panel';
import ScreenHeader from './header';

function ScreenLayout( { name } ) {
	const hasBorderPanel = useHasBorderPanel( name );
	const hasDimensionsPanel = useHasDimensionsPanel( name );

	return (
		<>
			<ScreenHeader title={ __( 'Layout' ) } />
			{ hasDimensionsPanel && <DimensionsPanel name={ name } /> }
			{ hasBorderPanel && <BorderPanel name={ name } /> }
		</>
	);
}

export default ScreenLayout;
