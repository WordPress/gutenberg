/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import TemplatesPagesMenu from './templates-pages';
import useTemplates from '../use-templates';

const GENERAL_TEMPLATE_SLUGS = [
	'front-page',
	'archive',
	'single',
	'singular',
	'index',
	'search',
	'404',
];

export default function TemplatesMenu( { onActiveIdChange } ) {
	const templates = useTemplates();
	const generalTemplates = templates?.filter( ( { slug } ) =>
		GENERAL_TEMPLATE_SLUGS.includes( slug )
	);

	return (
		<NavigationMenu menu="templates" title="Templates" parentMenu="root">
			<NavigationItem navigateToMenu="templates-pages" title="Pages" />

			{ generalTemplates?.map( ( template ) => (
				<NavigationItem
					key={ `template-${ template.id }` }
					item={ `template-${ template.slug }` }
					title={ template.slug }
					onClick={ () => onActiveIdChange( template.id ) }
				/>
			) ) }

			<TemplatesPagesMenu
				templates={ templates }
				onActiveIdChange={ onActiveIdChange }
			/>
		</NavigationMenu>
	);
}
