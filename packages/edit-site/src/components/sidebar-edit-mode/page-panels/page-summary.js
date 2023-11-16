/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
import { PostURLPanel } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PageStatus from './page-status';
import PublishDate from './publish-date';
import EditTemplate from './edit-template';

export default function PageSummary( {
	status,
	date,
	password,
	postId,
	postType,
} ) {
	return (
		<VStack>
			<PageStatus
				status={ status }
				date={ date }
				password={ password }
				postId={ postId }
				postType={ postType }
			/>
			<PublishDate
				status={ status }
				date={ date }
				postId={ postId }
				postType={ postType }
			/>
			<EditTemplate />
			<PostURLPanel />
		</VStack>
	);
}
