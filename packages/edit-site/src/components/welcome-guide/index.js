/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { Guide } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import WelcomeGuideImage from './image';
import { store as editSiteStore } from '../../store';

export default function WelcomeGuideTemplate() {
	const { toggleFeature } = useDispatch( editSiteStore );

	const isActive = useSelect(
		( select ) => select( editSiteStore ).isFeatureActive( 'welcomeGuide' ),
		[]
	);

	if ( ! isActive ) {
		return null;
	}

	return (
		<Guide
			className="edit-site-welcome-guide"
			contentLabel={ __( 'Welcome to the site editor' ) }
			finishButtonText={ __( 'Try Styles' ) }
			onFinish={ () => toggleFeature( 'welcomeGuide' ) }
			pages={ [
				{
					image: (
						<WelcomeGuideImage
							nonAnimatedSrc="https://s.w.org/images/block-editor/welcome-template-editor.svg"
							animatedSrc="https://s.w.org/images/block-editor/welcome-template-editor.gif"
						/>
					),
					content: (
						<>
							<h1 className="edit-site-welcome-guide__heading">
								{ __( 'Introducing: Styles' ) }
							</h1>
							<p className="edit-site-welcome-guide__text">
								{ __(
									'Try out and apply new colors, typography, and layout across your entire site. You can also customize the appearance of specific blocks, meaning that all paragraph blocks can appear the same with a few clicks.'
								) }
							</p>
						</>
					),
				},
			] }
		/>
	);
}
