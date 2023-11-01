/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import WelcomeGuideDefault from './default';
import WelcomeGuideTemplate from './template';
import { store as editPostStore } from '../../store';

export default function WelcomeGuide() {
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
