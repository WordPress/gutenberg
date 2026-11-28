import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import type { Field } from '@wordpress/dataviews';
import type { ComponentType } from 'react';

export type SiteSettings = {
	title?: string;
	description?: string;
	site_logo?: number;
	site_icon?: number;
};

/**
 * The fields that edit the site's identity: its title, tagline, logo and
 * icon. Shared by the Identity screens and the Site parts screens.
 *
 * The media fields take their edit component from the caller, as the
 * component and how its assets load differ between the site editors.
 *
 * @param MediaEdit The edit component for the logo and icon.
 * @return The fields.
 */
export function getSiteIdentityFields(
	MediaEdit: ComponentType< any >
): Field< SiteSettings >[] {
	return [
		{
			id: 'title',
			type: 'text',
			label: __( 'Site Title' ),
			description: __(
				"Displays in your site's layout via the Site Title block."
			),
			getValue: ( { item } ) => decodeEntities( item.title ?? '' ),
		},
		{
			id: 'description',
			type: 'text',
			label: __( 'Site Tagline' ),
			description: __(
				"In a few words, explain what this site is about. Displays in your site's layout via the Site Tagline block."
			),
			getValue: ( { item } ) => decodeEntities( item.description ?? '' ),
		},
		{
			id: 'site_logo',
			type: 'media',
			label: __( 'Site Logo' ),
			description: __(
				"Displays in your site's layout via the Site Logo block."
			),
			placeholder: __( 'Choose logo' ),
			Edit: MediaEdit,
			setValue: ( { value } ) => ( {
				site_logo: value ?? 0,
			} ),
		},
		{
			id: 'site_icon',
			type: 'media',
			label: __( 'Site Icon' ),
			description: __(
				'Shown in browser tabs, bookmarks, and mobile apps. It should be square and at least 512 by 512 pixels.'
			),
			placeholder: __( 'Choose icon' ),
			Edit: MediaEdit,
			setValue: ( { value } ) => ( {
				site_icon: value ?? 0,
			} ),
		},
	];
}
