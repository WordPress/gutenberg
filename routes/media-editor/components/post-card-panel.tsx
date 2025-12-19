/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { media as mediaIcon } from '@wordpress/icons';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import PostActions from './post-actions';

interface PostCardPanelProps {
	postType: string;
	postId: string;
}

export default function PostCardPanel( {
	postType,
	postId,
}: PostCardPanelProps ) {
	const { postTitle } = useSelect(
		( select ) => {
			const record = select( coreStore ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			);
			const title =
				record?.title?.rendered ||
				record?.title?.raw ||
				record?.title ||
				'';
			return {
				postTitle: title ? decodeEntities( title ) : '',
			};
		},
		[ postType, postId ]
	);

	return (
		<VStack spacing={ 3 }>
			<HStack justify="space-between" align="flex-start">
				<HStack
					justify="flex-start"
					spacing={ 2 }
					style={ { flexGrow: 1, minWidth: 0 } }
				>
					<Icon icon={ mediaIcon } size={ 24 } />
					<VStack
						spacing={ 0 }
						style={ { flexGrow: 1, minWidth: 0 } }
					>
						<Text
							numberOfLines={ 2 }
							weight={ 500 }
							ellipsizeMode="auto"
						>
							{ postTitle }
						</Text>
					</VStack>
				</HStack>
				<PostActions postType={ postType } postId={ postId } />
			</HStack>
		</VStack>
	);
}
