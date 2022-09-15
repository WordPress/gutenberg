/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { ExternalLink, Guide } from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { store as editWidgetsStore } from '../../store';

export default function WelcomeGuide() {
	const isActive = useSelect(
		( select ) =>
			!! select( preferencesStore ).get(
				'core/edit-widgets',
				'welcomeGuide'
			),
		[]
	);

	const { toggle } = useDispatch( preferencesStore );

	const widgetAreas = useSelect(
		( select ) =>
			select( editWidgetsStore ).getWidgetAreas( { per_page: -1 } ),
		[]
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
			onFinish={ () => toggle( 'core/edit-widgets', 'welcomeGuide' ) }
			pages={ [
				{
					image: (
						<WelcomeGuideImage
							nonAnimatedSrc="https://s.w.org/images/block-editor/welcome-canvas.svg"
							animatedSrc="https://s.w.org/images/block-editor/welcome-canvas.gif"
						/>
					),
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
					image: (
						<WelcomeGuideImage
							nonAnimatedSrc="https://s.w.org/images/block-editor/welcome-editor.svg"
							animatedSrc="https://s.w.org/images/block-editor/welcome-editor.gif"
						/>
					),
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
					image: (
						<WelcomeGuideImage
							nonAnimatedSrc="https://s.w.org/images/block-editor/welcome-library.svg"
							animatedSrc="https://s.w.org/images/block-editor/welcome-library.gif"
						/>
					),
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
											<img
												className="edit-widgets-welcome-guide__inserter-icon"
												alt={ __( 'inserter' ) }
												src="data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='18' height='18' rx='2' fill='%231E1E1E'/%3E%3Cpath d='M9.22727 4V14M4 8.77273H14' stroke='white' stroke-width='1.5'/%3E%3C/svg%3E%0A"
											/>
										),
									}
								) }
							</p>
						</>
					),
				},
				{
					image: (
						<WelcomeGuideImage
							nonAnimatedSrc="https://s.w.org/images/block-editor/welcome-documentation.svg"
							animatedSrc="https://s.w.org/images/block-editor/welcome-documentation.gif"
						/>
					),
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

function WelcomeGuideImage( { nonAnimatedSrc, animatedSrc } ) {
	return (
		<picture className="edit-widgets-welcome-guide__image">
			<source
				srcSet={ nonAnimatedSrc }
				media="(prefers-reduced-motion: reduce)"
			/>
			<img src={ animatedSrc } width="312" height="240" alt="" />
		</picture>
	);
}
