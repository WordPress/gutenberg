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
	 * Plan:
	 * 1: Get the custom_css post type
	 * 2: Get the slug of the active theme
	 * 3: Get the CSS content for the *active* theme only!
	 * 4: Fun part? Get changes to save.
	 * 
	 * X. Is the TextareaControl too primitive? Is there a better choice?
	 * X. Add the code icon before the button text.
	 */

	// So, this does not include the actual CSS,
	// need to figure out why and if it is stored somewhere else?
	const customCssPost = useSelect( ( select ) => {
		return select( coreStore ).getEntityRecords( 'postType', 'custom_css', {
			per_page: 1,
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
