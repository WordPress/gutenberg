/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
import {
	PostAuthorPanel,
	PostURLPanel,
	PostSchedulePanel,
	PostTemplatePanel,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PageStatus from './page-status';
import { unlock } from '../../../lock-unlock';

const { PrivatePostFeaturedImagePanel } = unlock( editorPrivateApis );

export default function PageSummary( {
	status,
	date,
	password,
	postId,
	postType,
} ) {
	return (
		<VStack spacing={ 0 }>
			<PrivatePostFeaturedImagePanel renderPanelBody={ false } />
			<PageStatus
				status={ status }
				date={ date }
				password={ password }
				postId={ postId }
				postType={ postType }
			/>
			<PostSchedulePanel />
			<PostTemplatePanel />
			<PostURLPanel />
			<PostAuthorPanel />
		</VStack>
	);
}
