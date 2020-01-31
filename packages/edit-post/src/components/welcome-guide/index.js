/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { ExternalLink, Guide, GuidePage } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { __experimentalCreateInterpolateElement } from '@wordpress/element';

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

export default function WelcomeGuide() {
	const isActive = useSelect(
		( select ) =>
			select( 'core/edit-post' ).isFeatureActive( 'welcomeGuide' ),
		[]
	);

	const { toggleFeature } = useDispatch( 'core/edit-post' );

	if ( ! isActive ) {
		return null;
	}

	return (
		<Guide
			className="edit-post-welcome-guide"
			contentLabel={ __( 'Welcome to the Block Editor' ) }
			finishButtonText={ __( 'Get started' ) }
			onFinish={ () => toggleFeature( 'welcomeGuide' ) }
		>
			<GuidePage className="edit-post-welcome-guide__page">
				<h1 className="edit-post-welcome-guide__heading">
					{ __( 'Welcome to the Block Editor' ) }
				</h1>
				<CanvasImage className="edit-post-welcome-guide__image" />
				<p className="edit-post-welcome-guide__text">
					{ __(
						'In the WordPress editor, each paragraph, image, or video is presented as a distinct “block” of content.'
					) }
				</p>
			</GuidePage>

			<GuidePage className="edit-post-welcome-guide__page">
				<h1 className="edit-post-welcome-guide__heading">
					{ __( 'Make each block your own' ) }
				</h1>
				<EditorImage className="edit-post-welcome-guide__image" />
				<p className="edit-post-welcome-guide__text">
					{ __(
						'Each block comes with its own set of controls for changing things like color, width, and alignment. These will show and hide automatically when you have a block selected.'
					) }
				</p>
			</GuidePage>

			<GuidePage className="edit-post-welcome-guide__page">
				<h1 className="edit-post-welcome-guide__heading">
					{ __( 'Get to know the Block Library' ) }
				</h1>
				<BlockLibraryImage className="edit-post-welcome-guide__image" />
				<p className="edit-post-welcome-guide__text">
					{ __experimentalCreateInterpolateElement(
						__(
							'All of the blocks available to you live in the Block Library. You’ll find it wherever you see the <InserterIconImage /> icon.'
						),
						{
							InserterIconImage: (
								<InserterIconImage className="edit-post-welcome-guide__inserter-icon" />
							),
						}
					) }
				</p>
			</GuidePage>

			<GuidePage className="edit-post-welcome-guide__page">
				<h1 className="edit-post-welcome-guide__heading">
					{ __( 'Learn how to use the Block Editor' ) }
				</h1>
				<DocumentationImage className="edit-post-welcome-guide__image" />
				<p className="edit-post-welcome-guide__text">
					{ __(
						'New to the Block Editor? Want to learn more about using it? '
					) }
					<ExternalLink
						href={ __(
							'https://wordpress.org/support/article/wordpress-editor/'
						) }
					>
						{ __( "Here's a detailed guide." ) }
					</ExternalLink>
				</p>
			</GuidePage>
		</Guide>
	);
}
