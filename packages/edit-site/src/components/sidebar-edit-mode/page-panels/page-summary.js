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

const {
	PrivatePostExcerptPanel,
	PostStatus,
	PostContentInformation,
	PostLastEditedPanel,
} = unlock( editorPrivateApis );

export default function PageSummary() {
	return (
		<VStack spacing={ 0 }>
			<PluginPostStatusInfo.Slot>
				{ ( fills ) => (
					<>
						<VStack
							spacing={ 2 }
							//  TODO: this needs to be consolidated with the panel in post editor, when we unify them.
							style={ { marginBlockEnd: '12px' } }
						>
							<PostFeaturedImagePanel withPanelBody={ false } />
							<PrivatePostExcerptPanel />
							<div>
								<PostContentInformation />
								<PostLastEditedPanel />
							</div>
						</VStack>
						<PostStatus />
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
