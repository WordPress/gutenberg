/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

interface PostActionsProps {
	postType: string;
	postId: string;
}

export default function PostActions( { postType, postId }: PostActionsProps ) {
	const { viewUrl } = useSelect(
		( select ) => {
			const record = select( coreStore ).getEntityRecord(
				'postType',
				postType,
				postId
			);
			return {
				viewUrl: record?.link || '',
			};
		},
		[ postType, postId ]
	);

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions' ) }
			className="media-editor-post-actions"
			popoverProps={ { placement: 'bottom-end' } }
		>
			{ () => (
				<MenuGroup>
					{ viewUrl && (
						<MenuItem
							href={ viewUrl }
							target="_blank"
							rel="noopener noreferrer"
						>
							{ __( 'View' ) }
						</MenuItem>
					) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
