/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { Guide } from '@wordpress/nux';
import { __ } from '@wordpress/i18n';
import { __experimentalCreateInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CanvasImage, EditorImage, BlockLibraryImage, InserterIconImage } from './images';

export default function WelcomeGuideModal() {
	const areTipsEnabled = useSelect( ( select ) => select( 'core/nux' ).areTipsEnabled() );

	const { disableTips } = useDispatch( 'core/nux' );

	if ( ! areTipsEnabled ) {
		return null;
	}

	return (
		<Guide
			className="edit-post-welcome-guide"
			finishButtonText={ __( 'Get started' ) }
			onFinish={ disableTips }
		>

			<Guide.Page className="edit-post-welcome-guide-modal__page">
				<h1 className="edit-post-welcome-guide-modal__heading">
					{ __( 'Welcome to the block editor' ) }
				</h1>
				<CanvasImage className="edit-post-welcome-guide-modal__image" />
				<p className="edit-post-welcome-guide-modal__text">
					{ __( 'In the WordPress editor, each paragraph, image, or video is presented as a distinct “block” of content.' ) }
				</p>
			</Guide.Page>

			<Guide.Page className="edit-post-welcome-guide-modal__page">
				<h1 className="edit-post-welcome-guide-modal__heading">
					{ __( 'Make each block your own' ) }
				</h1>
				<EditorImage className="edit-post-welcome-guide-modal__image" />
				<p className="edit-post-welcome-guide-modal__text">
					{ __( 'Each block comes with its own set of controls for changing things like color, width, and alignment. These will show and hide automatically when you have a block selected.' ) }
				</p>
			</Guide.Page>

			<Guide.Page className="edit-post-welcome-guide-modal__page">
				<h1 className="edit-post-welcome-guide-modal__heading">
					{ __( 'Get to know the block library' ) }
				</h1>
				<BlockLibraryImage className="edit-post-welcome-guide-modal__image" />
				<p className="edit-post-welcome-guide-modal__text">
					{ __experimentalCreateInterpolateElement(
						__( 'All of the blocks available to you live in the Block Library. You’ll find it wherever you see the <InserterIconImage /> icon.' ),
						{
							InserterIconImage: (
								<InserterIconImage
									className="edit-post-welcome-guide-modal__inserter-icon"
								/>
							),
						}
					) }
				</p>
			</Guide.Page>

		</Guide>
	);
}
