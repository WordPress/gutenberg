import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import { useMemo } from '@wordpress/element';
import type { ComponentType } from 'react';
import {
	getSiteIdentityFields,
	type SiteSettings,
} from './site-identity-fields';
import type { SitePartContents } from './get-site-part-contents';

/**
 * Edits the parts of the site's identity a site part shows: the title,
 * tagline and logo, each only when the part holds its block. Edits go to the
 * site settings, like the Identity screen's.
 *
 * @param props           Component props.
 * @param props.contents  What the part holds.
 * @param props.MediaEdit The edit component for the logo.
 */
export default function SitePartIdentity( {
	contents,
	MediaEdit,
}: {
	contents: SitePartContents;
	MediaEdit: ComponentType< any >;
} ) {
	const data = useSelect(
		( select ) =>
			select( coreStore ).getEditedEntityRecord(
				'root',
				'site',
				// The site entity is a singleton and has no record key.
				undefined as any
			) as SiteSettings,
		[]
	);
	const { editEntityRecord } = useDispatch( coreStore );
	const fields = useMemo(
		() => getSiteIdentityFields( MediaEdit ),
		[ MediaEdit ]
	);
	const form = useMemo(
		() => ( {
			fields: [
				contents.hasSiteTitle && 'title',
				contents.hasSiteTagline && 'description',
				contents.hasSiteLogo && 'site_logo',
			].filter( ( field ): field is string => !! field ),
		} ),
		[ contents.hasSiteTitle, contents.hasSiteTagline, contents.hasSiteLogo ]
	);

	return (
		<DataForm< SiteSettings >
			data={ data ?? {} }
			fields={ fields }
			form={ form }
			onChange={ ( edits ) =>
				editEntityRecord( 'root', 'site', undefined as any, edits )
			}
		/>
	);
}

/**
 * Whether a part holds anything the identity panel edits.
 *
 * @param contents What the part holds.
 * @return Whether to offer the panel.
 */
export function hasIdentityPanel( contents: SitePartContents ) {
	return (
		contents.hasSiteTitle || contents.hasSiteTagline || contents.hasSiteLogo
	);
}
