/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { ExternalLink, Guide } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WelcomeGuideImage from './image';
import { store as editPostStore } from '../../store';

export default function WelcomeGuideDefault() {
	const { toggleFeature } = useDispatch( editPostStore );

	return (
		<Guide
			className="edit-post-welcome-guide"
			contentLabel={ __( 'Welcome to the editor' ) }
			finishButtonText={ __( 'Get started' ) }
			onFinish={ () => toggleFeature( 'welcomeGuide' ) }
			pages={ [
				{
					image: (
						<WelcomeGuideImage
							nonAnimatedSrc="https://s.w.org/images/block-editor/welcome-canvas.svg"
							animatedSrc="https://s.w.org/images/block-editor/welcome-canvas.gif"
						/>
					),
					content: (
						<>
							<h1 className="edit-post-welcome-guide__heading">
								{ __( 'Welcome to the editor' ) }
							</h1>
							<p className="edit-post-welcome-guide__text">
								{ __(
									'In the WordPress editor, each paragraph, image, or video is presented as a distinct “block” of content.'
								) }
							</p>
						</>
					),
				},
				{
					image: (
						<WelcomeGuideImage
							nonAnimatedSrc="https://s.w.org/images/block-editor/welcome-editor.svg"
							animatedSrc="https://s.w.org/images/block-editor/welcome-editor.gif"
						/>
					),
					content: (
						<>
							<h1 className="edit-post-welcome-guide__heading">
								{ __( 'Customize each block' ) }
							</h1>
							<p className="edit-post-welcome-guide__text">
								{ __(
									'Each block comes with its own set of controls for changing things like color, width, and alignment. These will show and hide automatically when you have a block selected.'
								) }
							</p>
						</>
					),
				},
				{
					image: (
						<WelcomeGuideImage
							nonAnimatedSrc="https://s.w.org/images/block-editor/welcome-library.svg"
							animatedSrc="https://s.w.org/images/block-editor/welcome-library.gif"
						/>
					),
					content: (
						<>
							<h1 className="edit-post-welcome-guide__heading">
								{ __( 'Explore all blocks' ) }
							</h1>
							<p className="edit-post-welcome-guide__text">
								{ createInterpolateElement(
									__(
										'All of the blocks available to you live in the block library. You’ll find it wherever you see the <InserterIconImage /> icon.'
									),
									{
										InserterIconImage: (
											<img
												alt={ __( 'inserter' ) }
												src="data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='18' height='18' rx='2' fill='%231E1E1E'/%3E%3Cpath d='M9.22727 4V14M4 8.77273H14' stroke='white' stroke-width='1.5'/%3E%3C/svg%3E%0A"
											/>
										),
									}
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
							<h1 className="edit-post-welcome-guide__heading">
								{ __( 'Learn more' ) }
							</h1>
							<p className="edit-post-welcome-guide__text">
								{ createInterpolateElement(
									__(
										"New to the block editor? Want to learn more about using it? <a>Here's a detailed guide.</a>"
									),
									{
										a: (
											<ExternalLink
												href={ __(
													'https://wordpress.org/documentation/article/wordpress-block-editor/'
												) }
											/>
										),
									}
								) }
							</p>
						</>
					),
				},
			] }
		/>
	);
}
