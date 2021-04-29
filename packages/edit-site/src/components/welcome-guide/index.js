/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { Guide } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { DocumentationImage } from './images';
import { store as editSiteStore } from '../../store';

export default function WelcomeGuide() {
	const isActive = useSelect(
		( select ) => select( editSiteStore ).isFeatureActive( 'welcomeGuide' ),
		[]
	);

	const { toggleFeature } = useDispatch( editSiteStore );

	if ( ! isActive ) {
		return null;
	}

	return (
		<Guide
			className="edit-site-welcome-guide"
			contentLabel={ __( 'Welcome to the design editor' ) }
			finishButtonText={ __( 'Get started' ) }
			onFinish={ () => toggleFeature( 'welcomeGuide' ) }
			pages={ [
				{
					image: <DocumentationImage />,
					content: (
						<>
							<h1 className="edit-site-welcome-guide__heading">
								{ __( 'Welcome to the design editor' ) }
							</h1>
							<p className="edit-site-welcome-guide__text">
								{ __(
									'The Design Editor allows customizing all aspects of the site using the tools of blocks and patterns. Discover a whole new set of blocks to help build a site.'
								) }
							</p>
						</>
					),
				},
				{
					image: <DocumentationImage />,
					content: (
						<>
							<h1 className="edit-site-welcome-guide__heading">
								{ __( 'Create and edit templates' ) }
							</h1>
							<p className="edit-site-welcome-guide__text">
								{ __(
									'Templates express the layout of the site, including the homepage, archives, posts and pages. Add new layout elements like sidebars, edit the navigation, or customise the appearance of search results.'
								) }
							</p>
						</>
					),
				},
				{
					image: <DocumentationImage />,
					content: (
						<>
							<h1 className="edit-site-welcome-guide__heading">
								{ __( 'Paint with global styles' ) }
							</h1>
							<p className="edit-site-welcome-guide__text">
								{ __(
									'Change how different elements and blocks look across the entire site, including colors, typography, and spacing tools.'
								) }
							</p>
						</>
					),
				},
			] }
		/>
	);
}
