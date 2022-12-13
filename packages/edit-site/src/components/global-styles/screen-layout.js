/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DimensionsPanel, { useHasDimensionsPanel } from './dimensions-panel';
import ScreenHeader from './header';

function ScreenLayout( { name } ) {
	const hasDimensionsPanel = useHasDimensionsPanel( name );

	return (
		<>
			<ScreenHeader title={ __( 'Layout' ) } />
			{ hasDimensionsPanel && <DimensionsPanel name={ name } /> }
		</>
	);
}

export default ScreenLayout;
