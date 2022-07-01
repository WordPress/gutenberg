/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	TextareaControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Subtitle from './subtitle';

function ScreenCSS() {
	/**
	 * Original plan:
	 * 1: Get the slug of the current theme
	 * 2: Get the custom_css post type content for the current theme
	 * 3: Display the content inside the text area
	 * 4: Fun part? Get changes to save.
	 *
	 * X. Is the TextareaControl too primitive? Is there a better choice?
	 * X. Add the code icon before the button text.
	 * X. Validate the CSS!
	 *
	 * What we learnt:
	 * getEntityRecords for the custom_css post type does not include the content.
	 *
	 * Plan B: Create a new global styles setting for the custom css.
	 * Use this new setting to display the CSS on the global styles screen.
	 * Add the custom_css post type to the global styles rest API endpoint,
	 * and use the existing PHP filters to make sure that the CSS in the
	 * global styles option and the Customier option matches.
	 *
	 *
	 * X. Use the existing methods for printing the actual CSS on the front and editors?
	 */
	const currentTheme = useSelect( ( select ) => {
		return select( coreStore ).getEntityRecords( 'root', 'theme', {
			status: 'active',
		} )[ 0 ].stylesheet;
	}, [] );

	const customCssPost = useSelect( ( select ) => {
		return select( coreStore ).getEntityRecords( 'postType', 'custom_css', {
			per_page: 1,
			slug: currentTheme,
		} );
	}, [] );

	return (
		<>
			<ScreenHeader
				title={ __( 'CSS' ) }
				description={ __(
					'Customize the appearance of your site even further with CSS.'
				) }
			/>
			<div className="edit-site-global-styles-screen-css">
				<VStack spacing={ 3 }>
					<Subtitle>{ __( 'ADDITIONAL CSS' ) }</Subtitle>
					<TextareaControl />
				</VStack>
			</div>
		</>
	);
}

export default ScreenCSS;
