/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalColorGradientControl as ColorGradientControl } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import {
	getSupportedGlobalStylesPanels,
	useSetting,
	useStyle,
	useColorsPerOrigin,
} from './hooks';

const elements = {
	text: {
		description: __( '' ),
		title: __( 'Text' ),
	},
	link: {
		description: __( '' ),
		title: __( 'Links' ),
	},
	heading: {
		description: __( '' ),
		title: __( 'Headings' ),
	},
	caption: {
		description: __( 'Set the colors used for captions across the site' ),
		title: __( 'Captions' ),
	},
	button: {
		description: __(
			'Set the default colors used for buttons across the site.'
		),
		title: __( 'Buttons' ),
	},
};

function ScreenColorElement( { name, element } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const colorsPerOrigin = useColorsPerOrigin( name );
	const [ solids ] = useSetting( 'color.palette', name );
	const [ areCustomSolidsEnabled ] = useSetting( 'color.custom', name );

	const hasElementColor =
		supports.includes( 'color' ) &&
		( solids.length > 0 || areCustomSolidsEnabled );

	const [ elementTextColor, setElementTextColor ] = useStyle(
		'elements.' + element + '.color.text',
		name
	);
	const [ userElementTextColor ] = useStyle(
		'elements.' + element + '.color.text',
		name,
		'user'
	);

	const [ elementBgColor, setElementBgColor ] = useStyle(
		'elements.' + element + '.color.background',
		name
	);
	const [ userElementBgColor ] = useStyle(
		'elements.' + element + '.color.background',
		name,
		'user'
	);

	if ( ! hasElementColor ) {
		return null;
	}

	return (
		<>
			<ScreenHeader
				title={ elements[ element ].title }
				description={ elements[ element ].description }
			/>
			<div className="edit-site-global-styles-screen-element-color">
				<h4>{ __( 'Text color' ) }</h4>

				<ColorGradientControl
					className="edit-site-screen-element-color__control"
					colors={ colorsPerOrigin }
					disableCustomColors={ ! areCustomSolidsEnabled }
					__experimentalHasMultipleOrigins
					showTitle={ false }
					enableAlpha
					__experimentalIsRenderedInSidebar
					colorValue={ elementTextColor }
					onColorChange={ setElementTextColor }
					clearable={ elementTextColor === userElementTextColor }
				/>

				<h4>{ __( 'Background color' ) }</h4>

				<ColorGradientControl
					className="edit-site-screen-element-color__control"
					colors={ colorsPerOrigin }
					disableCustomColors={ ! areCustomSolidsEnabled }
					__experimentalHasMultipleOrigins
					showTitle={ false }
					enableAlpha
					__experimentalIsRenderedInSidebar
					colorValue={ elementBgColor }
					onColorChange={ setElementBgColor }
					clearable={ elementBgColor === userElementBgColor }
				/>
			</div>
		</>
	);
}

export default ScreenColorElement;
