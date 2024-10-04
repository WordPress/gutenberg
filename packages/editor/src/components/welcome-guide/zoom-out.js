/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { Guide } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';

export default function WelcomeGuideZoomOut() {
	const isActive = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		return get( 'core', 'welcomeGuideZoomOut' );
	}, [] );
	const { set } = useDispatch( preferencesStore );
	return (
		<Guide
			className="editor-welcome-guide"
			contentLabel={ __( 'Welcome to the Zoom Out view' ) }
			finishButtonText={ __( 'Continue' ) }
			onFinish={ () => set( 'core', 'welcomeGuideZoomOut', ! isActive ) }
			pages={ [
				{
					image: (
						<picture className="editor-welcome-guide__image">
							<source
								srcSet="https://s.w.org/images/block-editor/welcome-template-editor.svg"
								media="(prefers-reduced-motion: reduce)"
							/>
							<img
								src="https://s.w.org/images/block-editor/welcome-template-editor.gif"
								width="312"
								height="240"
								alt={ __( 'Zoom Out view' ) }
							/>
						</picture>
					),
					content: (
						<>
							<h1 className="editor-welcome-guide__heading">
								{ __( 'Welcome to the Zoom Out view' ) }
							</h1>
							<p className="editor-welcome-guide__text">
								{ __(
									'The Zoom Out view simplifies your editing experience by allowing you to create and edit at the pattern level rather than focusing on individual blocks.'
								) }
							</p>
						</>
					),
				},
			] }
		/>
	);
}
