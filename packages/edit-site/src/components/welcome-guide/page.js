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
		const { hasPageContentFocus } = select( editSiteStore );
		return isPageActive && ! isEditorActive && hasPageContentFocus();
	}, [] );

	if ( ! isVisible ) {
		return null;
	}

	const heading = __( 'Editing your page' );

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
									'We’ve recently introduced the ability to edit pages within the site editor. You can switch to editing your template using the settings sidebar.'
								) }
							</p>
						</>
					),
				},
			] }
		/>
	);
}
