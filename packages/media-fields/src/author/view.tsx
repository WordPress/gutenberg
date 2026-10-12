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

	return (
		<Stack direction="row" align="center" gap="sm">
			<Avatar.Root size="xs" aria-hidden="true">
				<Avatar.Fallback>
					<Icon icon={ authorIcon } size={ 16 } />
				</Avatar.Fallback>
				<Avatar.Image src={ imageUrl } alt="" keepMounted />
			</Avatar.Root>
			<span className="media-author-field__name">{ text }</span>
		</Stack>
	);
}
