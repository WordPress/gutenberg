/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const TRANSLATED_SITE_PROPERTIES = {
	title: __( 'Title' ),
	description: __( 'Tagline' ),
	site_logo: __( 'Logo' ),
	site_icon: __( 'Icon' ),
	show_on_front: __( 'Show on front' ),
	page_on_front: __( 'Page on front' ),
	posts_per_page: __( 'Maximum posts per page' ),
	default_comment_status: __( 'Allow comments on new posts' ),
};

export const useIsDirty = () => {
	const { dirtyEntityRecords } = useSelect( ( select ) => {
		const dirtyRecords =
			select( coreStore ).__experimentalGetDirtyEntityRecords();

		// Remove site object and decouple into its edited pieces.
		const dirtyRecordsWithoutSite = dirtyRecords.filter(
			( record ) => ! ( record.kind === 'root' && record.name === 'site' )
		);

		const siteEdits = select( coreStore ).getEntityRecordEdits(
			'root',
			'site'
		);

		const siteEditsAsEntities = [];
		for ( const property in siteEdits ) {
			siteEditsAsEntities.push( {
				kind: 'root',
				name: 'site',
				title: TRANSLATED_SITE_PROPERTIES[ property ] || property,
				property,
			} );
		}
		const dirtyRecordsWithSiteItems = [
			...dirtyRecordsWithoutSite,
			...siteEditsAsEntities,
		];

		return {
			dirtyEntityRecords: dirtyRecordsWithSiteItems,
		};
	}, [] );

	// Unchecked entities to be ignored by save function.
	const [ unselectedEntities, _setUnselectedEntities ] = useState( [] );

	const setUnselectedEntities = (
		{ kind, name, key, property },
		checked
	) => {
		if ( checked ) {
			_setUnselectedEntities(
				unselectedEntities.filter(
					( elt ) =>
						elt.kind !== kind ||
						elt.name !== name ||
						elt.key !== key ||
						elt.property !== property
				)
			);
		} else {
			_setUnselectedEntities( [
				...unselectedEntities,
				{ kind, name, key, property },
			] );
		}
	};

	const isDirty = dirtyEntityRecords.length - unselectedEntities.length > 0;

	return {
		dirtyEntityRecords,
		isDirty,
		setUnselectedEntities,
		unselectedEntities,
	};
};
