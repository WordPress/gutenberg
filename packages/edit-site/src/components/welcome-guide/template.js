/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { Guide } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as editorStore } from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';

export default function WelcomeGuideTemplate() {
	const { toggle } = useDispatch( preferencesStore );

	const visibility = useSelect( ( select ) => {
		const isTemplateActive = !! select( preferencesStore ).get(
			'core/edit-site',
			'welcomeGuideTemplate'
		);
		const isEditorActive = !! select( preferencesStore ).get(
			'core/edit-site',
			'welcomeGuide'
		);
		const { getCurrentPostType, getEditorSettings } = select( editorStore );
		const hasBackNavigation =
			!! getEditorSettings().onNavigateToPreviousEntityRecord;
		return (
			isTemplateActive &&
			! isEditorActive &&
			getCurrentPostType() === 'wp_template' &&
			hasBackNavigation
		);
	}, [] );

	// The visibility conditions change in such a way that it’s tricky to avoid
	// an unexpected flash of the component. Using state and debouncing writes
	// to it works around the issue.
	const [ isVisible, setIsVisible ] = useState();
	const debouncedSetIsVisible = useDebounce( setIsVisible, 32 );
	debouncedSetIsVisible( visibility );

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
