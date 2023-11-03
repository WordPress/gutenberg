/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useMemo } from '@wordpress/element';

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
	templateType,
	templateId,
} ) {
	const context = useMemo(
		() => ( { postId, postType } ),
		[ postId, postType ]
	);
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
			<EditTemplate
				postType={ templateType }
				postId={ templateId }
				context={ context }
			/>
		</VStack>
	);
}
