/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

// This is an alternative italic icon provided for the mobile editor to
// avoid confusion with the slash key. See: https://github.com/wordpress-mobile/WordPress-iOS/pull/16064#issuecomment-821541499
// TODO: Once we align with core on an italic icon that does not look like a
// slash, we can remove the native variant
const formatItalic = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M16 5H10V6.5H12.0464L10.1136 17.5H8V19H14V17.5H12.0136L13.9464 6.5H16V5Z" />
	</SVG>
);

export default formatItalic;
