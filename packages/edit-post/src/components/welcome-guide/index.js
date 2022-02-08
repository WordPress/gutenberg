/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { withFilters } from '@wordpress/components';

/**
 * Internal dependencies
 */
import WelcomeGuideDefault from './default';
import WelcomeGuideTemplate from './template';
import { store as editPostStore } from '../../store';

function WelcomeGuide() {
	const { isActive, isTemplateMode } = useSelect( ( select ) => {
		const { isFeatureActive, isEditingTemplate } = select( editPostStore );
		const _isTemplateMode = isEditingTemplate();
		const feature = _isTemplateMode
			? 'welcomeGuideTemplate'
			: 'welcomeGuide';

		return {
			isActive: isFeatureActive( feature ),
			isTemplateMode: _isTemplateMode,
		};
	}, [] );

	if ( ! isActive ) {
		return null;
	}

	return isTemplateMode ? <WelcomeGuideTemplate /> : <WelcomeGuideDefault />;
}

export default withFilters( 'editPost.WelcomeGuide' )( WelcomeGuide );
