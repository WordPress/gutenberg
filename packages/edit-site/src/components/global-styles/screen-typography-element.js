/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalNavigatorButton as NavigatorButton } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TypographyPanel from './typography-panel';
import ScreenHeader from './header';

function BlockStylesLink( { children } ) {
	return (
		<NavigatorButton path={ '/blocks' } isLink>
			{ ' ' }
			{ children }{ ' ' }
		</NavigatorButton>
	);
}

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
		hint: createInterpolateElement(
			__(
				'Some special headings like your Site Title and Post Title are managed separately via dedicated settings under the <link>Styles > Blocks</link> menu.'
			),
			{ link: <BlockStylesLink /> }
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
