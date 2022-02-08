/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withFilters, Button, ExternalLink } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';

function WelcomeGuide( { sidebar } ) {
	const { toggleFeature } = useDispatch( interfaceStore );

	const isEntirelyBlockWidgets = sidebar
		.getWidgets()
		.every( ( widget ) => widget.id.startsWith( 'block-' ) );

	return (
		<div className="customize-widgets-welcome-guide">
			<div className="customize-widgets-welcome-guide__image__wrapper">
				<picture>
					<source
						srcSet="https://s.w.org/images/block-editor/welcome-editor.svg"
						media="(prefers-reduced-motion: reduce)"
					/>
					<img
						className="customize-widgets-welcome-guide__image"
						src="https://s.w.org/images/block-editor/welcome-editor.gif"
						width="312"
						height="240"
						alt=""
					/>
				</picture>
			</div>
			<h1 className="customize-widgets-welcome-guide__heading">
				{ __( 'Welcome to block Widgets' ) }
			</h1>
			<p className="customize-widgets-welcome-guide__text">
				{ isEntirelyBlockWidgets
					? __(
							'Your theme provides different “block” areas for you to add and edit content. Try adding a search bar, social icons, or other types of blocks here and see how they’ll look on your site.'
					  )
					: __(
							'You can now add any block to your site’s widget areas. Don’t worry, all of your favorite widgets still work flawlessly.'
					  ) }
			</p>
			<Button
				className="customize-widgets-welcome-guide__button"
				variant="primary"
				onClick={ () =>
					toggleFeature( 'core/customize-widgets', 'welcomeGuide' )
				}
			>
				{ __( 'Got it' ) }
			</Button>
			<hr className="customize-widgets-welcome-guide__separator" />
			{ ! isEntirelyBlockWidgets && (
				<p className="customize-widgets-welcome-guide__more-info">
					{ __( 'Want to stick with the old widgets?' ) }
					<br />
					<ExternalLink
						href={ __(
							'https://wordpress.org/plugins/classic-widgets/'
						) }
					>
						{ __( 'Get the Classic Widgets plugin.' ) }
					</ExternalLink>
				</p>
			) }
			<p className="customize-widgets-welcome-guide__more-info">
				{ __( 'New to the block editor?' ) }
				<br />
				<ExternalLink
					href={ __(
						'https://wordpress.org/support/article/wordpress-editor/'
					) }
				>
					{ __( "Here's a detailed guide." ) }
				</ExternalLink>
			</p>
		</div>
	);
}

export default withFilters( 'customizeWidgets.WelcomeGuide' )( WelcomeGuide );
