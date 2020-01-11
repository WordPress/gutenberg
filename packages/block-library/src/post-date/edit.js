/**
 * WordPress dependencies
 */
import { useEntityProp, useEntityId } from '@wordpress/core-data';
import { __experimentalGetSettings, dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';

function PostDateDisplay() {
	const [ date ] = useEntityProp( 'postType', 'post', 'date' );
	const settings = __experimentalGetSettings();

	return date ? (
		<time dateTime={ dateI18n( 'c', date ) }>
			{ dateI18n( settings.formats.date, date ) }
		</time>
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
