/**
 * WordPress dependencies
 */
import { Guide } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function WelcomeGuideImage( { nonAnimatedSrc, animatedSrc } ) {
	return (
		<picture className="edit-reusable-block-welcome-guide__image">
			<source
				srcSet={ nonAnimatedSrc }
				media="(prefers-reduced-motion: reduce)"
			/>
			<img src={ animatedSrc } width="312" height="240" alt="" />
		</picture>
	);
}

function ReusableBlockWelcomeGuide( { isGudieOpen, setIsGudieOpen } ) {
	if ( ! isGudieOpen ) {
		return null;
	}

	return (
		<Guide
			className="edit-reusable-block-welcome-guide"
			contentLabel={ __( 'Get familiar with Reusable blocks' ) }
			finishButtonText={ __( 'Got it' ) }
			onFinish={ () => setIsGudieOpen( false ) }
			pages={ [
				{
					image: (
						<WelcomeGuideImage
							nonAnimatedSrc="https://s.w.org/images/block-editor/welcome-reusable.svg?3"
							animatedSrc="https://s.w.org/images/block-editor/welcome-reusable.gif?2"
						/>
					),
					content: (
						<>
							<h1 className="edit-reusable-block-welcome-guide__heading">
								{ __( 'Get familiar with Reusable blocks' ) }
							</h1>
							<p className="edit-reusable-block-welcome-guide__text">
								{ __(
									'You just saved a Reusable block. Any other documents that include this block have been updated to reflect this change. To make local changes, try converting to regular blocks first.'
								) }
							</p>
						</>
					),
				},
			] }
		/>
	);
}

export default ReusableBlockWelcomeGuide;
