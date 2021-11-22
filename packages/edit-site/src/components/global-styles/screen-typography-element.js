/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TypographyPanel from './typography-panel';
import ScreenHeader from './header';

const elementDescriptions = {
	text: __( 'Manage the fonts used on the site.' ),
	link: __( 'Manage the fonts and typography used on the links.' ),
};

function ScreenTypographyElement( { name, element } ) {
	const parentMenu =
		name === undefined ? '/typography' : '/blocks/' + name + '/typography';

	return (
		<>
			<ScreenHeader
				back={ parentMenu }
				title={ __( 'Typography' ) }
				description={ elementDescriptions[ element ] }
			/>
			<TypographyPanel name={ name } element={ element } />
		</>
	);
}

export default ScreenTypographyElement;
