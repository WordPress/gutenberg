/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
import {
	PostAuthorPanel,
	PostURLPanel,
	PostSchedulePanel,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PageStatus from './page-status';
import EditTemplate from './edit-template';

export default function PageSummary( {
	status,
	date,
	password,
	postId,
	postType,
} ) {
	return (
		<VStack spacing={ 0 }>
			<PageStatus
				status={ status }
				date={ date }
				password={ password }
				postId={ postId }
				postType={ postType }
			/>
			<PostSchedulePanel />
			<EditTemplate />
			<PostURLPanel />
			<PostAuthorPanel />
		</VStack>
	);
}
