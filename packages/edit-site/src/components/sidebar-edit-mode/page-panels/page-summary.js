/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
/**
 * Internal dependencies
 */
import PageStatus from './page-status';
import PublishDate from './publish-date';

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
		</VStack>
	);
}
