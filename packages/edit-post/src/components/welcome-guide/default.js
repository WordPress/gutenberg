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
/**
 * Internal dependencies
 */
import {
	CanvasImage,
	EditorImage,
	BlockLibraryImage,
	DocumentationImage,
	InserterIconImage,
} from './images';
import { store as editPostStore } from '../../store';

export default function WelcomeGuideDefault() {
	const { toggleFeature } = useDispatch( editPostStore );

	return (
		<Guide
			className="edit-post-welcome-guide"
			contentLabel={ __( 'Welcome to the block editor' ) }
			finishButtonText={ __( 'Get started' ) }
			onFinish={ () => toggleFeature( 'welcomeGuide' ) }
			pages={ [
				{
					image: <CanvasImage />,
					content: (
						<>
							<h1 className="edit-post-welcome-guide__heading">
								{ __( 'Welcome to the block editor' ) }
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
					image: <EditorImage />,
					content: (
						<>
							<h1 className="edit-post-welcome-guide__heading">
								{ __( 'Make each block your own' ) }
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
					image: <BlockLibraryImage />,
					content: (
						<>
							<h1 className="edit-post-welcome-guide__heading">
								{ __( 'Get to know the block library' ) }
							</h1>
							<p className="edit-post-welcome-guide__text">
								{ createInterpolateElement(
									__(
										'All of the blocks available to you live in the block library. You’ll find it wherever you see the <InserterIconImage /> icon.'
									),
									{
										InserterIconImage: (
											<InserterIconImage className="edit-post-welcome-guide__inserter-icon" />
										),
									}
								) }
							</p>
						</>
					),
				},
				{
					image: <DocumentationImage />,
					content: (
						<>
							<h1 className="edit-post-welcome-guide__heading">
								{ __( 'Learn how to use the block editor' ) }
							</h1>
							<p className="edit-post-welcome-guide__text">
								{ __(
									'New to the block editor? Want to learn more about using it? '
								) }
								<ExternalLink
									href={ __(
										'https://wordpress.org/support/article/wordpress-editor/'
									) }
								>
									{ __( "Here's a detailed guide." ) }
								</ExternalLink>
							</p>
						</>
					),
				},
			] }
		/>
	);
}
