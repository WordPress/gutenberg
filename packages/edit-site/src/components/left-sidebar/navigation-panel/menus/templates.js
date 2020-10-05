/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import TemplatesPagesMenu from './templates-pages';

const GENERAL_TEMPLATE_SLUGS = [
	'front-page',
	'archive',
	'single',
	'singular',
	'index',
	'search',
	'404',
];

function useTemplates() {
	const [ templateFiles, setTemplateFiles ] = useState( [] );

	useEffect( () => {
		apiFetch( {
			path: '/__experimental/edit-site/v1/page-templates',
		} ).then( ( res ) => {
			setTemplateFiles( res );
		} );
	}, [] );

	const templateEntities = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecords( 'postType', 'wp_template' ) ||
			[],
		[]
	);

	const templatesFilesWithoutEntities = templateFiles.filter(
		( slug ) =>
			! templateEntities?.find( ( entity ) => slug === entity.slug )
	);

	return [
		...templatesFilesWithoutEntities.map( ( slug ) => ( {
			id: slug,
			slug,
		} ) ),
		...templateEntities,
	];
}

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
