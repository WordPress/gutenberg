/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import { useCanCustomizeColor } from './hooks';
import ScreenElementColorpicker from './screen-element-colorpicker';

function ScreenLinkColor( { name } ) {
	const canCustomize = useCanCustomizeColor(
		name,
		'color.text',
		'linkColor'
	);

	if ( ! canCustomize ) {
		return null;
	}

	return (
		<>
			<ScreenHeader
				title={ __( 'Links' ) }
				description={ __(
					'Manage the fonts and typography used on the links.'
				) }
			/>
			<ScreenElementColorpicker
				name={ name }
				element="button"
				path="elements.link.color.text"
			/>
		</>
	);
}

export default ScreenLinkColor;
