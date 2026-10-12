import { commentAuthorAvatar as authorIcon } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components -- This bundled package already depends on @wordpress/ui.
import { Avatar, Icon, Stack } from '@wordpress/ui';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
import type { MediaItem } from '../types';

export default function AuthorView( {
	item,
}: DataViewRenderFieldProps< MediaItem > ) {
	const author = item?._embedded?.author?.[ 0 ];
	const text = author?.name;
	const imageUrl = author?.avatar_urls?.[ 48 ];

	const initials = text
		?.trim()
		.split( /\s+/ )
		.slice( 0, 2 )
		.map( ( word ) => Array.from( word )[ 0 ] )
		.join( '' )
		.toUpperCase();
	return (
		<Stack
			direction="row"
			align="center"
			gap={ initials ? 'sm' : undefined }
		>
			{ initials ? (
				<Avatar.Root size="xs" aria-hidden="true">
					<Avatar.Fallback>{ initials }</Avatar.Fallback>
					<Avatar.Image src={ imageUrl } alt="" keepMounted />
				</Avatar.Root>
			) : (
				<div className="media-author-field__icon" aria-hidden="true">
					<Icon icon={ authorIcon } />
				</div>
			) }
			<span className="media-author-field__name">{ text }</span>
		</Stack>
	);
}
