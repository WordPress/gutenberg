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

export default function NavigateToLink( { url, activeId, onActiveIdChange } ) {
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
						const { getEntityRecords } = select( 'core' );
						newTemplateId = getEntityRecords(
							'postType',
							'wp_template',
							{
								resolved: true,
								slug: data.post_name,
							}
						)[ 0 ].id;
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
	}, [ url ] );
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
