/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostActions from '../post-actions';
import PostIcon from '../post-icon';
import PostTitle from '../post-title-inline';

export default function PostCardPanel( {
	postType,
	postId,
	onActionPerformed,
} ) {
	return (
		<div className="editor-post-card-panel">
			<HStack
				spacing={ 2 }
				className="editor-post-card-panel__header"
				align="flex-start"
			>
				<PostIcon postId={ postId } postType={ postType } />
				<Text
					className="editor-post-card-panel__title"
					as="h2"
					numberOfLines={ 2 }
					truncate
				>
					<PostTitle postId={ postId } postType={ postType } />
				</Text>
				<PostActions
					postType={ postType }
					postId={ postId }
					onActionPerformed={ onActionPerformed }
				/>
			</HStack>
		</div>
	);
}
