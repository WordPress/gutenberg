/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { navigation as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import deprecated from './deprecated';
import useNavigationMenu from './use-navigation-menu';
import buildNavigationLabel from './build-navigation-label';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			overlayMenu: 'never',
		},
		innerBlocks: [
			{
				name: 'core/navigation-link',
				attributes: {
					// translators: 'Home' as in a website's home page.
					label: __( 'Home' ),
					url: 'https://make.wordpress.org/',
				},
			},
			{
				name: 'core/navigation-link',
				attributes: {
					// translators: 'About' as in a website's about page.
					label: __( 'About' ),
					url: 'https://make.wordpress.org/',
				},
			},
			{
				name: 'core/navigation-link',
				attributes: {
					// translators: 'Contact' as in a website's contact page.
					label: __( 'Contact' ),
					url: 'https://make.wordpress.org/',
				},
			},
		],
	},
	__experimentalLabel( { ref } ) {
		const { navigationMenu } = useNavigationMenu( ref );
		return buildNavigationLabel(
			navigationMenu.title,
			1, // This has to be 1 because in this context there is only one Navigation shown.
			navigationMenu.status
		);
	},
	edit,
	save,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
