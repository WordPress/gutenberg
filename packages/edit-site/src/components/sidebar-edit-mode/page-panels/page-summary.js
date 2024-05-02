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
import { unlock } from '../../../lock-unlock';

const { PrivatePostExcerptPanel, PostStatus } = unlock( editorPrivateApis );

export default function PageSummary() {
	return (
		<VStack spacing={ 0 }>
			<PluginPostStatusInfo.Slot>
				{ ( fills ) => (
					<>
						<PostStatus />
						<PostFeaturedImagePanel withPanelBody={ false } />
						<PrivatePostExcerptPanel />
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
