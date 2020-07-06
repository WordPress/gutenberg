/**
 * WordPress dependencies
 */
import { getPathAndQueryString } from '@wordpress/url';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { useSelect, useRegistry } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { findTemplate } from '../../utils';

export default function NavigateToLink( {
	type,
	id,
	activePage,
	onActivePageChange,
} ) {
	const pageEntity = useSelect(
		( select ) =>
			type &&
			id &&
			type !== 'URL' &&
			select( 'core' ).getEntityRecord( 'postType', type, id ),
		[ type, id ]
	);

	const registry = useRegistry();
	const [ templateId, setTemplateId ] = useState();
	useEffect( () => {
		if ( pageEntity )
			findTemplate(
				pageEntity.link,
				registry.__experimentalResolveSelect( 'core' ).getEntityRecords
			).then(
				( newTemplateId ) => setTemplateId( newTemplateId ),
				() => setTemplateId( null )
			);
	}, [ pageEntity?.link, registry ] );

	const onClick = useMemo( () => {
		if ( ! pageEntity || ! templateId ) return null;
		const path = getPathAndQueryString( pageEntity.link );
		if ( path === activePage.path ) return null;
		return () =>
			onActivePageChange( {
				type,
				slug: pageEntity.slug,
				path,
				context: {
					postType: pageEntity.type,
					postId: pageEntity.id,
				},
			} );
	}, [ pageEntity, templateId, activePage.path, onActivePageChange ] );
	return (
		onClick && (
			<Button
				icon="welcome-write-blog"
				label={ __( 'Edit Page Template' ) }
				onClick={ onClick }
			/>
		)
	);
}
