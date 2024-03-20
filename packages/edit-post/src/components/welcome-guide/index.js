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
	const { isActive, isEditingTemplate } = useSelect( ( select ) => {
		const { isFeatureActive } = select( editPostStore );
		const { getCurrentPostType } = select( editorStore );
		const _isEditingTemplate = getCurrentPostType() === 'wp_template';

		const feature = _isEditingTemplate
			? 'welcomeGuideTemplate'
			: 'welcomeGuide';

		return {
			isActive: isFeatureActive( feature ),
			isEditingTemplate: _isEditingTemplate,
		};
	}, [] );

	if ( ! isActive ) {
		return null;
	}

	return isEditingTemplate ? (
		<WelcomeGuideTemplate />
	) : (
		<WelcomeGuideDefault />
	);
}
