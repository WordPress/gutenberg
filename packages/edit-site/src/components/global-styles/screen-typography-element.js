/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TypographyPanel from './typography-panel';
import ScreenHeader from './header';

const elements = {
	text: {
		description: __( 'Manage the fonts used on the site.' ),
		title: __( 'Text' ),
	},
	link: {
		description: __( 'Manage the fonts and typography used on the links.' ),
		title: __( 'Links' ),
	},
	heading: {
		description: __( 'Manage the fonts and typography used on headings.' ),
		title: __( 'Headings' ),
		hint: (
			<>
				{ __(
					'Block headings like Site Title and Post Title should be managed in the '
				) }
				<strong>{ __( 'Styles' ) }</strong>
				{ __( ' > ' ) }
				<strong>{ __( 'Blocks' ) }</strong>
				{ __( ' menu.' ) }
			</>
		),
	},
	button: {
		description: __( 'Manage the fonts and typography used on buttons.' ),
		title: __( 'Buttons' ),
	},
};

function ScreenTypographyElement( { name, element } ) {
	return (
		<>
			<ScreenHeader
				title={ elements[ element ].title }
				description={ elements[ element ].description }
				hint={ elements[ element ].hint }
			/>
			<TypographyPanel name={ name } element={ element } />
		</>
	);
}

export default ScreenTypographyElement;
