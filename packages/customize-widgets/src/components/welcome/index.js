/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { EditorImage } from './images';

export default function Welcome( { sidebar } ) {
	const isEntirelyBlockWidgets = sidebar
		.getWidgets()
		.every( ( widget ) => widget.id.startsWith( 'block-' ) );

	return (
		<div className="customize-widgets-welcome">
			<EditorImage />
			<h1>{ __( 'Welcome to block Widgets' ) }</h1>
			<p>
				{ isEntirelyBlockWidgets
					? __(
							'Your theme provides different “block” areas for you to add and edit content. Try adding a search bar, social icons, or other types of blocks here and see how they’ll look on your site.'
					  )
					: __(
							'You can now add any block to your site’s widget areas. Don’t worry, all of your favorite widgets still work flawlessly.'
					  ) }
			</p>
			<Button
				className="customize-widgets-welcome__button"
				isPrimary
				onClick={ () => {} }
			>
				{ __( 'Got it' ) }
			</Button>
			<hr className="customize-widgets-welcome__separator" />
			{ ! isEntirelyBlockWidgets && (
				<p>
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
			<p>
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
