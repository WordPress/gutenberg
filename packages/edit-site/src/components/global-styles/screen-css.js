/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Subtitle from './subtitle';
import CustomCSSControl from './custom-css';

function ScreenCSS( { name } ) {
	// If name is defined, we are customizing CSS at the block level.
	// Display the block title in the description.
	const blockType = getBlockType( name );
	const title = blockType?.title;

	const description =
		title !== undefined
			? sprintf(
					// translators: %s: is the name of a block e.g., 'Image' or 'Table'.
					__(
						'Add your own CSS to customize the appearance of the %s block.'
					),
					title
			  )
			: __(
					'Add your own CSS to customize the appearance and layout of your site.'
			  );

	return (
		<>
			<ScreenHeader title={ __( 'CSS' ) } description={ description } />
			<div className="edit-site-global-styles-screen-css">
				<VStack spacing={ 3 }>
					<Subtitle>{ __( 'ADDITIONAL CSS' ) }</Subtitle>
					<CustomCSSControl blockName={ name } />
				</VStack>
			</div>
		</>
	);
}

export default ScreenCSS;
