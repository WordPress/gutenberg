/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import CustomCSSControl from './custom-css';

function ScreenCSS( { name, variation } ) {
	// If name is defined, we are customizing CSS at the block level.
	// Display the block title in the description.
	const blockType = getBlockType( name );

	const title = variation
		? sprintf(
				// translators: %1$s: is the name of a block e.g., 'Image' or 'Table'. %2$s: is the name of a block variation e.g., 'Rounded' or 'Outline'.
				__(
					'Add your own CSS to customize the appearance of the %1$s block when using the %2$s variation.'
				),
				blockType?.title,
				variation
		  )
		: sprintf(
				// translators: %s: is the name of a block e.g., 'Image' or 'Table'.
				__(
					'Add your own CSS to customize the appearance of the %s block.'
				),
				blockType?.title
		  );

	const description =
		title !== undefined
			? title
			: __(
					'Add your own CSS to customize the appearance and layout of your site.'
			  );

	return (
		<>
			<ScreenHeader
				title={ __( 'CSS' ) }
				description={
					<>
						{ description }
						<ExternalLink
							href="https://wordpress.org/documentation/article/css/"
							className="edit-site-global-styles-screen-css-help-link"
						>
							{ __( 'Learn more about CSS' ) }
						</ExternalLink>
					</>
				}
			/>
			<div className="edit-site-global-styles-screen-css">
				<CustomCSSControl blockName={ name } variation={ variation } />
			</div>
		</>
	);
}

export default ScreenCSS;
