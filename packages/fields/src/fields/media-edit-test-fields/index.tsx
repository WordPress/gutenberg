/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MediaEdit from '../../components/media-edit';
import type { BasePost } from '../../types';

interface BasePostWithTestMeta extends BasePost {
	test_media_gallery?: number[];
	test_media_gallery_2?: number[];
	test_media_single?: number;
}

const sharedConfig = {
	type: 'media',
	enableSorting: false,
	filterBy: false,
} as const;

export const mediaEditTestFields: Field< BasePostWithTestMeta >[] = [
	{
		...sharedConfig,
		id: 'test_media_gallery',
		label: __( 'Test Gallery (Expanded)' ),
		Edit: ( props ) => <MediaEdit { ...props } multiple isExpanded />,
		getValue: ( { item } ) => item.test_media_gallery,
		setValue: ( { value } ) => ( {
			test_media_gallery: Array.isArray( value ) ? value : [],
		} ),
	},
	{
		...sharedConfig,
		id: 'test_media_gallery_2',
		label: __( 'Test Gallery (Compact)' ),
		Edit: ( props ) => (
			<MediaEdit { ...props } multiple isExpanded={ false } />
		),
		getValue: ( { item } ) => item.test_media_gallery_2,
		setValue: ( { value } ) => ( {
			test_media_gallery_2: Array.isArray( value ) ? value : [],
		} ),
	},
	{
		...sharedConfig,
		id: 'test_media_single',
		label: __( 'Test Single (Expanded)' ),
		Edit: ( props ) => <MediaEdit { ...props } isExpanded />,
		getValue: ( { item } ) => item.test_media_single,
		setValue: ( { value } ) => ( { test_media_single: value ?? 0 } ),
	},
];

export default mediaEditTestFields;
