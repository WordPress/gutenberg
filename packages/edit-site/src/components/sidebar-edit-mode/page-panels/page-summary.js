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
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PageStatus from './page-status';

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
