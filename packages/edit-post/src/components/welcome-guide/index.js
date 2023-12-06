/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import WelcomeGuideDefault from './default';
import WelcomeGuideTemplate from './template';
import { store as editPostStore } from '../../store';

export default function WelcomeGuide() {
	const { isActive, isTemplateMode } = useSelect( ( select ) => {
		const { isFeatureActive } = select( editPostStore );
		const { getRenderingMode } = select( editorStore );
		const _isTemplateMode = getRenderingMode() !== 'post-only';
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
