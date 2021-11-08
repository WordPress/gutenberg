/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { Guide } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WelcomeGuideImage from './image';
import { store as editSiteStore } from '../../store';

export default function WelcomeGuideEditor() {
	const { toggleFeature } = useDispatch( editSiteStore );

	return (
		<Guide
			className="edit-site-welcome-guide"
			contentLabel={ __( 'Welcome to the site editor' ) }
			finishButtonText={ __( 'Get Started' ) }
			onFinish={ () => toggleFeature( 'welcomeGuide' ) }
			pages={ [
				{
					image: (
						<WelcomeGuideImage
							nonAnimatedSrc=""
							animatedSrc="https://user-images.githubusercontent.com/4933/140506067-cd8cbab4-9a36-4e17-b3ad-c4d86659ffa3.gif"
						/>
					),
					content: (
						<>
							<h1 className="edit-site-welcome-guide__heading">
								{ __( 'Edit your site' ) }
							</h1>
							<p className="edit-site-welcome-guide__text">
								{ createInterpolateElement(
									__(
										'Design everything on your site — from the header right down to the footer — using blocks. Click <StylesIconImage /> to start designing your blocks, and choose your typography, layout, and colors.'
									),
									{
										StylesIconImage: (
											<img
												alt={ __( 'styles' ) }
												src="data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 4c-4.4 0-8 3.6-8 8v.1c0 4.1 3.2 7.5 7.2 7.9h.8c4.4 0 8-3.6 8-8s-3.6-8-8-8zm0 15V5c3.9 0 7 3.1 7 7s-3.1 7-7 7z' fill='%231E1E1E'/%3E%3C/svg%3E%0A"
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
