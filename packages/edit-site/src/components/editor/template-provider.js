/**
 * External dependencies
 */
import { startsWith } from 'lodash';

/**
 * WordPress dependencies
 */
import { EntityProvider } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';

export default function TemplateProvider( { children, id, type } ) {
	const template = useSelect( ( select ) =>
		select( 'core' ).getEntityRecord( 'postType', type, id )
	);
	const { saveEntityRecord } = useDispatch( 'core' );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ entityId, setEntityId ] = useState();

	useEffect( () => {
		if ( id !== entityId ) {
			setEntityId( id );
		}
	}, [ id ] );

	const saveTemplateAutoDraft = useCallback( async () => {
		setIsSaving( true );
		const templateData = {
			title: template.title,
			slug: template.slug,
			excerpt: template.excerpt,
			content: template.content,
			status: 'auto-draft',
		};
		const templateAutoDraft = await saveEntityRecord(
			'postType',
			'wp_template',
			templateData
		);
		setEntityId( templateAutoDraft.id );
		setIsSaving( false );
	}, [ template ] );

	useEffect( () => {
		if (
			isSaving ||
			! template ||
			'wp_template' !== type ||
			! startsWith( entityId, 'file-template-' )
		) {
			return;
		}

		saveTemplateAutoDraft();
	}, [ entityId, isSaving, saveTemplateAutoDraft, template, type ] );

	return (
		<EntityProvider kind="postType" id={ entityId } type={ type }>
			{ children }
		</EntityProvider>
	);
}
