/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, ExternalLink } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { EditorImage } from './images';
import { store as customizeWidgetsStore } from '../../store';

export default function WelcomeGuide( { sidebar } ) {
	const { __unstableToggleFeature: toggleFeature } = useDispatch(
		customizeWidgetsStore
	);

	const isEntirelyBlockWidgets = sidebar
		.getWidgets()
		.every( ( widget ) => widget.id.startsWith( 'block-' ) );

	return (
		<div className="customize-widgets-welcome-guide">
			<EditorImage />
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
				onClick={ () => toggleFeature( 'welcomeGuide' ) }
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
