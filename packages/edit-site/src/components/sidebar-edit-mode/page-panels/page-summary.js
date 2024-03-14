/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
import {
	PostAuthorPanel,
	PostURLPanel,
	PostSchedulePanel,
	PostTemplatePanel,
	PostFeaturedImagePanel,
	PostStatus,
} from '@wordpress/editor';

export default function PageSummary() {
	return (
		<VStack spacing={ 0 }>
			<PostFeaturedImagePanel withPanelBody={ false } />
			<PostStatus />
			<PostSchedulePanel />
			<PostTemplatePanel />
			<PostURLPanel />
			<PostAuthorPanel />
		</VStack>
	);
}
