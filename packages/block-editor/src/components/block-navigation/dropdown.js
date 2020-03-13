/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

function BlockNavigationDropdown() {
	deprecated( 'BlockNavigationDropdown component', {
		hint: 'This component is now include in the TableOfContents component.',
	} );
	return null;
}

export default BlockNavigationDropdown;
