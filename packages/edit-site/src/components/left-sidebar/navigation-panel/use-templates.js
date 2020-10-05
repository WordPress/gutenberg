/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

export default function useTemplates() {
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
