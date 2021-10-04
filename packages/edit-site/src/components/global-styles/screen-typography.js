/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useGlobalStylesContext } from '../editor/global-styles-provider';
import TypographyPanel from './typography-panel';
import ScreenHeader from './header';

function ScreenTypography( { name } ) {
	const { root, blocks, getStyle, setStyle } = useGlobalStylesContext();
	const context = name === undefined ? root : blocks[ name ];
	const parentMenu = name === undefined ? '' : '/blocks/' + name;

	return (
		<>
			<ScreenHeader
				back={ parentMenu ? parentMenu : '/' }
				title={ __( 'Typography' ) }
			/>
			<TypographyPanel
				context={ context }
				getStyle={ getStyle }
				setStyle={ setStyle }
			/>
		</>
	);
}

export default ScreenTypography;
