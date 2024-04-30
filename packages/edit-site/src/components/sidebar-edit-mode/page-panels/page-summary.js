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
							spacing={ 3 }
							//  TODO: this needs to be consolidated with the panel in post editor, when we unify them.
							style={ { marginBlockEnd: '24px' } }
						>
							<PostFeaturedImagePanel withPanelBody={ false } />
							<PrivatePostExcerptPanel />
							<VStack spacing={ 1 }>
								<PostContentInformation />
								<PostLastEditedPanel />
							</VStack>
						</VStack>
						<VStack
							spacing={ 1 }
							style={ { marginBlockEnd: '12px' } }
						>
							<PostStatus />
							<PostSchedulePanel />
							<PostTemplatePanel />
							<PostURLPanel />
						</VStack>
						<PostAuthorPanel />
						{ fills }
					</>
				) }
			</PluginPostStatusInfo.Slot>
		</VStack>
	);
}
