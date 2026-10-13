import type { FieldsScriptParts } from '@wordpress/fields-loader';
import FeaturedImageEdit from './edit';
import FeaturedImageView from './view';
import type { PostWithFeaturedMedia } from './types';

/**
 * The JavaScript parts of the featured image field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithFeaturedMedia >[ string ] =
	{
		Edit: FeaturedImageEdit,
		render: FeaturedImageView,
		// A post without a featured image stores `0`, not an empty value.
		setValue: ( { value } ) => ( {
			featured_media: ( value as number | undefined ) ?? 0,
		} ),
	};
