/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TypographyPanel from './typography-panel';
import ScreenHeader from './header';

function ScreenTypography( { name } ) {
	const parentMenu = name === undefined ? '' : '/blocks/' + name;

	return (
		<>
			<ScreenHeader
				back={ parentMenu ? parentMenu : '/' }
				title={ __( 'Typography' ) }
				description={ __(
					'Manage the fonts used on the website and the default aspect of different global elements.'
				) }
			/>
			<TypographyPanel name={ name } />
		</>
	);
}

export default ScreenTypography;
