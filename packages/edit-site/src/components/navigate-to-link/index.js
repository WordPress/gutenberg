/**
 * WordPress dependencies
 */
import { useState, useEffect, useMemo } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { select } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Browser dependencies
 */
const { fetch } = window;

export default function NavigateToLink( {
	url,
	templateIds,
	activeId,
	onActiveIdChange,
} ) {
	const [ templateId, setTemplateId ] = useState();
	useEffect( () => {
		const effect = async () => {
			try {
				const { success, data } = await fetch(
					addQueryArgs( url, { '_wp-find-template': true } )
				).then( ( res ) => res.json() );
				if ( success ) {
					let newTemplateId = data.ID;
					if ( newTemplateId === null ) {
						const { getEntityRecord } = select( 'core' );
						newTemplateId = templateIds
							.map( ( id ) =>
								getEntityRecord( 'postType', 'wp_template', id )
							)
							.find(
								( template ) => template.slug === data.post_name
							).id;
					}
					setTemplateId( newTemplateId );
				} else {
					throw new Error();
				}
			} catch ( err ) {
				setTemplateId( null );
			}
		};
		effect();
	}, [ url, templateIds ] );
	const onClick = useMemo( () => {
		if ( ! templateId || templateId === activeId ) {
			return null;
		}
		return () => onActiveIdChange( templateId );
	}, [ templateId, activeId, onActiveIdChange ] );
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
