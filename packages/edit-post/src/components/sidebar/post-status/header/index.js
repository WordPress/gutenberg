/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	DropdownMenu,
	MenuGroup,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import {
	store as editorStore,
	usePostPendingStatusCheck,
	usePostLastRevisionCheck,
	usePostTrashCheck,
} from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostPendingStatus from './post-pending-status';
import PostLastRevision from './post-last-revision';
import PostTrash from './post-trash';

export default function PostStatusHeader() {
	const hasPostPendingStatus = usePostPendingStatusCheck();
	const hasPostLastRevision = usePostLastRevisionCheck();
	const hasPostTrash = usePostTrashCheck();

	const postTypeName = useSelect( ( select ) => {
		const postTypeSlug = select( editorStore ).getCurrentPostType();
		const postType = select( coreStore ).getPostType( postTypeSlug );
		return postType?.labels?.singular_name;
	}, [] );

	return (
		<HStack className="edit-post-post-status__header">
			<Heading className="edit-post-post-status__heading" level={ 2 }>
				{ __( 'Summary' ) }
			</Heading>
			{ ( hasPostPendingStatus ||
				hasPostLastRevision ||
				hasPostTrash ) && (
				<DropdownMenu
					icon={ moreVertical }
					label={
						postTypeName
							? // translators: %s: Post type, e.g. "Post" or "Page".
							  sprintf( __( '%s options' ), postTypeName )
							: __( 'Post options' )
					}
					toggleProps={ { isSmall: true } }
				>
					{ () => (
						<>
							{ ( hasPostPendingStatus ||
								hasPostLastRevision ) && (
								<MenuGroup>
									{ hasPostPendingStatus && (
										<PostPendingStatus />
									) }
									{ hasPostLastRevision && (
										<PostLastRevision />
									) }
								</MenuGroup>
							) }
							{ hasPostTrash && (
								<MenuGroup>
									<PostTrash />
								</MenuGroup>
							) }
						</>
					) }
				</DropdownMenu>
			) }
		</HStack>
	);
}
