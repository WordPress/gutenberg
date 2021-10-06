/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useGlobalStylesContext } from '../editor/global-styles-provider';
import BorderPanel, { useHasBorderPanel } from './border-panel';
import DimensionsPanel, { useHasDimensionsPanel } from './dimensions-panel';
import ScreenHeader from './header';

function ScreenLayout( { name } ) {
	const { root, blocks, getStyle, setStyle } = useGlobalStylesContext();
	const context = name === undefined ? root : blocks[ name ];
	const parentMenu = name === undefined ? '' : '/blocks/' + name;
	const hasBorderPanel = useHasBorderPanel( context );
	const hasDimensionsPanel = useHasDimensionsPanel( context );

	return (
		<>
			<ScreenHeader
				back={ parentMenu ? parentMenu : '/' }
				title={ __( 'Layout' ) }
			/>
			{ hasDimensionsPanel && (
				<DimensionsPanel
					context={ context }
					getStyle={ getStyle }
					setStyle={ setStyle }
				/>
			) }
			{ hasBorderPanel && (
				<BorderPanel
					context={ context }
					getStyle={ getStyle }
					setStyle={ setStyle }
				/>
			) }
		</>
	);
}

export default ScreenLayout;
