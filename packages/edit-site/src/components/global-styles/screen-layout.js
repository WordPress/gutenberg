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
	const parentMenu = name === undefined ? '' : '/blocks/' + name;
	const hasBorderPanel = useHasBorderPanel( name );
	const hasDimensionsPanel = useHasDimensionsPanel( name );

	return (
		<>
			<ScreenHeader
				back={ parentMenu ? parentMenu : '/' }
				title={ __( 'Layout' ) }
			/>
			{ hasDimensionsPanel && <DimensionsPanel name={ name } /> }
			{ hasBorderPanel && <BorderPanel name={ name } /> }
		</>
	);
}

export default ScreenLayout;
