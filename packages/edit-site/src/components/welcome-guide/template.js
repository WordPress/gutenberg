/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { Guide } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as editorStore } from '@wordpress/editor';

export default function WelcomeGuideTemplate() {
	const { toggle } = useDispatch( preferencesStore );

	const { isActive, hasPreviousEntity } = useSelect( ( select ) => {
		const { getEditorSettings } = select( editorStore );
		const { get } = select( preferencesStore );
		return {
			isActive: get( 'core/edit-site', 'welcomeGuideTemplate' ),
			hasPreviousEntity:
				!! getEditorSettings().onNavigateToPreviousEntityRecord,
		};
	}, [] );
	const isVisible = isActive && hasPreviousEntity;

	if ( ! isVisible ) {
		return null;
	}

	const heading = __( 'Editing a template' );

	return (
		<Guide
			className="edit-site-welcome-guide guide-template"
			contentLabel={ heading }
			finishButtonText={ __( 'Continue' ) }
			onFinish={ () =>
				toggle( 'core/edit-site', 'welcomeGuideTemplate' )
			}
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
								src="https://s.w.org/images/block-editor/editing-your-template.mp4"
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
									'Note that the same template can be used by multiple pages, so any changes made here may affect other pages on the site. To switch back to editing the page content click the ‘Back’ button in the toolbar.'
								) }
							</p>
						</>
					),
				},
			] }
		/>
	);
}
