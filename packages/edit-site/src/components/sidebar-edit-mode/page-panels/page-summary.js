/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
import {
	PluginPostStatusInfo,
	PostAuthorPanel,
	PostURLPanel,
	PostSchedulePanel,
	PostTemplatePanel,
	PostFeaturedImagePanel,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PageStatus from './page-status';
import { unlock } from '../../../lock-unlock';

const { PrivatePostExcerptPanel } = unlock( editorPrivateApis );

export default function PageSummary( {
	status,
	date,
	password,
	postId,
	postType,
} ) {
	return (
		<VStack spacing={ 0 }>
			<PluginPostStatusInfo.Slot>
				{ ( fills ) => (
					<>
						<PostFeaturedImagePanel withPanelBody={ false } />
						<PrivatePostExcerptPanel />
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
						{ fills }
					</>
				) }
			</PluginPostStatusInfo.Slot>
		</VStack>
	);
}
