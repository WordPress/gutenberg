import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { store as postPickerStore } from '@wordpress/post-picker';
import { Stack, Text } from '@wordpress/ui';
import type { MediaItem } from '../types';
import { getRenderedContent } from '../utils/get-rendered-content';

type PostType = {
	slug: string;
	viewable?: boolean;
	labels?: { singular_name?: string };
};

export default function MediaAttachedToEdit( {
	data,
	onChange,
}: DataFormControlProps< MediaItem > ) {
	const isAttached = !! data.post;
	const attachedTo = isAttached
		? data._embedded?.[ 'wp:attached-to' ]?.[ 0 ]
		: undefined;

	const { postTypeLabel, attachablePostTypes } = useSelect(
		( select ) => {
			const { getPostType, getPostTypes } = select( coreStore );
			const postTypes = getPostTypes( { per_page: -1 } ) as
				PostType[] | null;
			return {
				postTypeLabel: attachedTo?.type
					? ( getPostType( attachedTo.type ) as PostType | undefined )
							?.labels?.singular_name
					: undefined,
				attachablePostTypes: postTypes,
			};
		},
		[ attachedTo?.type ]
	);
	const { pickPosts } = useDispatch( postPickerStore );

	const handleChoose = async () => {
		const postTypes = ( attachablePostTypes ?? [] )
			.filter(
				( postType ) =>
					postType.viewable && postType.slug !== 'attachment'
			)
			.map( ( postType ) => postType.slug );
		const posts = await pickPosts( {
			postType: postTypes.length ? postTypes : [ 'post', 'page' ],
			value: data.post ? [ data.post ] : undefined,
			title: __( 'Attach to' ),
			selectLabel: __( 'Attach' ),
		} );
		const post = posts?.[ 0 ];
		if ( ! post ) {
			return;
		}
		onChange( {
			post: post.id,
			_embedded: {
				...data._embedded,
				'wp:attached-to': [
					{
						id: post.id,
						type: post.type,
						link: post.link as string,
						title: {
							raw: post.title?.raw ?? '',
							rendered: post.title?.rendered ?? '',
						},
					},
				],
			},
		} );
	};

	const handleDetach = () => {
		onChange( {
			post: 0,
			_embedded: { ...data._embedded, 'wp:attached-to': undefined },
		} );
	};

	return (
		<Stack direction="column" gap="md">
			{ isAttached ? (
				<Stack direction="column" gap="xs">
					<Text>
						{ getRenderedContent( attachedTo?.title ) ||
							__( '(no title)' ) }
					</Text>
					{ postTypeLabel && (
						<Text variant="body-sm">{ postTypeLabel }</Text>
					) }
				</Stack>
			) : (
				<Text>
					{ __( 'This file isn’t attached to any content.' ) }
				</Text>
			) }
			<Text variant="body-sm">
				{ __(
					'A file can be attached to one post, page, or other content. Detaching doesn’t delete the file or remove it from content that uses it.'
				) }
			</Text>
			<Stack direction="row" gap="sm">
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ handleChoose }
				>
					{ isAttached ? __( 'Change' ) : __( 'Attach' ) }
				</Button>
				{ isAttached && (
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ handleDetach }
					>
						{ __( 'Detach' ) }
					</Button>
				) }
			</Stack>
		</Stack>
	);
}
