/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import WelcomeGuideDefault from './default';
import WelcomeGuideTemplate from './template';
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { interfaceStore } = unlock( editorPrivateApis );

export default function WelcomeGuide( { postType } ) {
	const { isActive, isEditingTemplate } = useSelect(
		( select ) => {
			const { isFeatureActive } = select( editPostStore );
			const _isEditingTemplate = postType === 'wp_template';
			const feature = _isEditingTemplate
				? 'welcomeGuideTemplate'
				: 'welcomeGuide';

			return {
				isActive: isFeatureActive( feature ),
				isEditingTemplate: _isEditingTemplate,
			};
		},
		[ postType ]
	);
	const { openModal, closeModal } = useDispatch( interfaceStore );
	const { isModalActive } = useSelect( interfaceStore );

	// Register the guide so that other editor UI, such as the "Choose a
	// pattern" modal, can wait for it to be dismissed before showing.
	useEffect( () => {
		if ( ! isActive ) {
			return;
		}

		openModal( 'editor/welcome-guide' );

		return () => {
			// Only close if another modal hasn't taken over in the meantime.
			if ( isModalActive( 'editor/welcome-guide' ) ) {
				closeModal();
			}
		};
	}, [ isActive, openModal, closeModal, isModalActive ] );

	if ( ! isActive ) {
		return null;
	}

	return isEditingTemplate ? (
		<WelcomeGuideTemplate />
	) : (
		<WelcomeGuideDefault />
	);
}
