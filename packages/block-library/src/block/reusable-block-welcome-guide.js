/**
 * WordPress dependencies
 */
import { Guide, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function ReusableBlockWelcomeGuide( { isGudieOpen, setIsGudieOpen } ) {
	if ( ! isGudieOpen ) {
		return null;
	}

	return (
		<Guide
			className="edit-reusable-block-welcome-guide"
			contentLabel={ __( 'Get familiar with Reusable blocks' ) }
			finishButtonText={ __( 'Get started' ) }
			onFinish={ () => setIsGudieOpen( false ) }
			pages={ [
				{
					image: (
						<div className="edit-reusable-block-welcome-guide__image"></div>
					),
					content: (
						<>
							<h1 className="edit-reusable-block-welcome-guide__heading">
								{ __( 'Get familiar with Reusable blocks' ) }
							</h1>
							<p className="edit-reusable-block-welcome-guide__text">
								{ __(
									'You just saved a Reusable block. Any other documents that include this block have been updated to reflect this change. '
								) }
								<ExternalLink
									href={ __(
										'https://wordpress.com/support/wordpress-editor/blocks/reusable-block/'
									) }
								>
									{ __( 'Learn More.' ) }
								</ExternalLink>
							</p>
						</>
					),
				},
			] }
		/>
	);
}

export default ReusableBlockWelcomeGuide;
