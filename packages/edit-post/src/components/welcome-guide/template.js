/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { Guide } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import WelcomeGuideImage from './image';
import { store as editPostStore } from '../../store';

export default function WelcomeGuideTemplate() {
	const { toggleFeature } = useDispatch( editPostStore );

	return (
		<Guide
			className="edit-post-welcome-guide"
			contentLabel={ __( 'Welcome to the template editor' ) }
			finishButtonText={ __( 'Get started' ) }
			onFinish={ () => toggleFeature( 'welcomeGuideTemplate' ) }
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
							<h1 className="edit-post-welcome-guide__heading">
								{ __( 'Welcome to the template editor' ) }
							</h1>
							<p className="edit-post-welcome-guide__text">
								{ __(
									'Templates express the layout of the site. Customize all aspects of your posts and pages using the tools of blocks and patterns.'
								) }
							</p>
						</>
					),
				},
			] }
		/>
	);
}
