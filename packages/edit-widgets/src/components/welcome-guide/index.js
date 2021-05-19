/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { ExternalLink, Guide } from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	CanvasImage,
	EditorImage,
	BlockLibraryImage,
	DocumentationImage,
	InserterIconImage,
} from './images';
import { store as editWidgetsStore } from '../../store';

export default function WelcomeGuide() {
	const isActive = useSelect(
		( select ) =>
			select( editWidgetsStore ).__unstableIsFeatureActive(
				'welcomeGuide'
			),
		[]
	);

	const { __unstableToggleFeature: toggleFeature } = useDispatch(
		editWidgetsStore
	);

	const widgetAreas = useSelect( ( select ) =>
		select( editWidgetsStore ).getWidgetAreas( { per_page: -1 } )
	);

	if ( ! isActive ) {
		return null;
	}

	const isEntirelyBlockWidgets = widgetAreas?.every(
		( widgetArea ) =>
			widgetArea.id === 'wp_inactive_widgets' ||
			widgetArea.widgets.every( ( widgetId ) =>
				widgetId.startsWith( 'block-' )
			)
	);

	const numWidgetAreas =
		widgetAreas?.filter(
			( widgetArea ) => widgetArea.id !== 'wp_inactive_widgets'
		).length ?? 0;

	return (
		<Guide
			className="edit-widgets-welcome-guide"
			contentLabel={ __( 'Welcome to block Widgets' ) }
			finishButtonText={ __( 'Get started' ) }
			onFinish={ () => toggleFeature( 'welcomeGuide' ) }
			pages={ [
				{
					image: <CanvasImage />,
					content: (
						<>
							<h1 className="edit-widgets-welcome-guide__heading">
								{ __( 'Welcome to block Widgets' ) }
							</h1>
							{ isEntirelyBlockWidgets ? (
								<>
									<p className="edit-widgets-welcome-guide__text">
										{ sprintf(
											// Translators: %s: Number of block areas in the current theme.
											_n(
												'Your theme provides %s “block” area for you to add and edit content. Try adding a search bar, social icons, or other types of blocks here and see how they’ll look on your site.',
												'Your theme provides %s different “block” areas for you to add and edit content. Try adding a search bar, social icons, or other types of blocks here and see how they’ll look on your site.',
												numWidgetAreas
											),
											numWidgetAreas
										) }
									</p>
								</>
							) : (
								<>
									<p className="edit-widgets-welcome-guide__text">
										{ __(
											'You can now add any block to your site’s widget areas. Don’t worry, all of your favorite widgets still work flawlessly.'
										) }
									</p>
									<p className="edit-widgets-welcome-guide__text">
										<strong>
											{ __(
												'Want to stick with the old widgets?'
											) }
										</strong>{ ' ' }
										<ExternalLink
											href={ __(
												'https://wordpress.org/plugins/classic-widgets/'
											) }
										>
											{ __(
												'Get the Classic Widgets plugin.'
											) }
										</ExternalLink>
									</p>
								</>
							) }
						</>
					),
				},
				{
					image: <EditorImage />,
					content: (
						<>
							<h1 className="edit-widgets-welcome-guide__heading">
								{ __( 'Make each block your own' ) }
							</h1>
							<p className="edit-widgets-welcome-guide__text">
								{ __(
									'Each block comes with its own set of controls for changing things like color, width, and alignment. These will show and hide automatically when you have a block selected.'
								) }
							</p>
						</>
					),
				},
				{
					image: <BlockLibraryImage />,
					content: (
						<>
							<h1 className="edit-widgets-welcome-guide__heading">
								{ __( 'Get to know the block library' ) }
							</h1>
							<p className="edit-widgets-welcome-guide__text">
								{ createInterpolateElement(
									__(
										'All of the blocks available to you live in the block library. You’ll find it wherever you see the <InserterIconImage /> icon.'
									),
									{
										InserterIconImage: (
											<InserterIconImage className="edit-widgets-welcome-guide__inserter-icon" />
										),
									}
								) }
							</p>
						</>
					),
				},
				{
					image: <DocumentationImage />,
					content: (
						<>
							<h1 className="edit-widgets-welcome-guide__heading">
								{ __( 'Learn how to use the block editor' ) }
							</h1>
							<p className="edit-widgets-welcome-guide__text">
								{ __(
									'New to the block editor? Want to learn more about using it? '
								) }
								<ExternalLink
									href={ __(
										'https://wordpress.org/support/article/wordpress-editor/'
									) }
								>
									{ __( "Here's a detailed guide." ) }
								</ExternalLink>
							</p>
						</>
					),
				},
			] }
		/>
	);
}
