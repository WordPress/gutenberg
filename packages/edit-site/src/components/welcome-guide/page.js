/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { Guide } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function WelcomeGuidePage() {
	const { toggle } = useDispatch( preferencesStore );

	const isVisible = useSelect( ( select ) => {
		const isPageActive = !! select( preferencesStore ).get(
			'core/edit-site',
			'welcomeGuidePage'
		);
		const isEditorActive = !! select( preferencesStore ).get(
			'core/edit-site',
			'welcomeGuide'
		);
		const { isPage } = select( editSiteStore );
		return isPageActive && ! isEditorActive && isPage();
	}, [] );

	if ( ! isVisible ) {
		return null;
	}

	const heading = __( 'Editing a page' );

	return (
		<Guide
			className="edit-site-welcome-guide guide-page"
			contentLabel={ heading }
			finishButtonText={ __( 'Continue' ) }
			onFinish={ () => toggle( 'core/edit-site', 'welcomeGuidePage' ) }
			pages={ [
				{
					image: (
						<video
							className="edit-site-welcome-guide__video"
							autoPlay
							loop
							muted
							width="312"
							height="240"
						>
							<source
								src="https://s.w.org/images/block-editor/editing-your-page.mp4"
								type="video/mp4"
							/>
						</video>
					),
					content: (
						<>
							<h1 className="edit-site-welcome-guide__heading">
								{ heading }
							</h1>
							<p className="edit-site-welcome-guide__text">
								{ __(
									'It’s now possible to edit page content in the site editor. To customise other parts of the page like the header and footer switch to editing the template using the settings sidebar.'
								) }
							</p>
						</>
					),
				},
			] }
		/>
	);
}
