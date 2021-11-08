/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { ExternalLink, Guide } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import WelcomeGuideImage from './image';
import { store as editSiteStore } from '../../store';

export default function WelcomeGuideStyles() {
	const { toggleFeature } = useDispatch( editSiteStore );

	return (
		<Guide
			className="edit-site-welcome-guide"
			contentLabel={ __( 'Welcome to styles' ) }
			finishButtonText={ __( 'Get Started' ) }
			onFinish={ () => toggleFeature( 'welcomeGuideStyles' ) }
			pages={ [
				{
					image: (
						<WelcomeGuideImage
							nonAnimatedSrc=""
							animatedSrc="https://user-images.githubusercontent.com/4933/140506059-88d5f9d2-219f-4448-9e3e-4325208f3be0.gif"
						/>
					),
					content: (
						<>
							<h1 className="edit-site-welcome-guide__heading">
								{ __( 'Welcome to Styles' ) }
							</h1>
							<p className="edit-site-welcome-guide__text">
								{ __(
									'Tweak your site, or give it a whole new look! Get creative — how about a new color palette for your buttons, or choosing a new font? Take a look at what you can do here.'
								) }
							</p>
						</>
					),
				},
				{
					image: (
						<WelcomeGuideImage
							nonAnimatedSrc=""
							animatedSrc="https://user-images.githubusercontent.com/4933/140503972-f10ab71a-b86e-4f73-935b-dd277e782a57.gif"
						/>
					),
					content: (
						<>
							<h1 className="edit-site-welcome-guide__heading">
								{ __( 'Set the design' ) }
							</h1>
							<p className="edit-site-welcome-guide__text">
								{ __(
									'You can customize your site as much as you like with different colors, typography, and layouts. Or if you prefer, just leave it up to your theme to handle! '
								) }
							</p>
						</>
					),
				},
				{
					image: (
						<WelcomeGuideImage
							nonAnimatedSrc=""
							animatedSrc="https://user-images.githubusercontent.com/4933/140499197-e497a167-edb8-4bfa-a462-3065dc962aba.gif"
						/>
					),
					content: (
						<>
							<h1 className="edit-site-welcome-guide__heading">
								{ __( 'Personalize blocks' ) }
							</h1>
							<p className="edit-site-welcome-guide__text">
								{ __(
									'You can adjust your blocks to ensure a cohesive experience across your site — add your unique colors to a branded Button block, or adjust the Heading block to your preferred size.'
								) }
							</p>
						</>
					),
				},
				{
					image: (
						<WelcomeGuideImage
							nonAnimatedSrc="https://s.w.org/images/block-editor/welcome-documentation.svg"
							animatedSrc="https://s.w.org/images/block-editor/welcome-documentation.gif"
						/>
					),
					content: (
						<>
							<h1 className="edit-site-welcome-guide__heading">
								{ __( 'Learn more' ) }
							</h1>
							<p className="edit-site-welcome-guide__text">
								{ __(
									'New to block themes and styling your site? '
								) }
								<ExternalLink
									href={ __(
										'https://wordpress.org/support/article/wordpress-editor/'
									) }
								>
									{ __(
										'Here’s a detailed guide to learn how to make the most of it.'
									) }
								</ExternalLink>
							</p>
						</>
					),
				},
			] }
		/>
	);
}
