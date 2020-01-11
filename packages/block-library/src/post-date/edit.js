/**
 * WordPress dependencies
 */
import { useEntityProp, useEntityId } from '@wordpress/core-data';
import { __experimentalGetSettings, dateI18n } from '@wordpress/date';
import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

function PostDateDisplay() {
	const [ date ] = useEntityProp( 'postType', 'post', 'date' );
	const settings = __experimentalGetSettings();

	return date ? (
		<RichText.Content
			tagName="h6"
			value={ dateI18n( settings.formats.date, date ) }
		/>
	) : (
		__( 'No Date' )
	);
}

export default function PostDateEdit() {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return 'Post Date Placeholder';
	}
	return <PostDateDisplay />;
}
