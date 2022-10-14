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
		description: __(
			'Set the default color used for text across the site.'
		),
		title: __( 'Text' ),
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
	let [ isBackgroundEnabled ] = useSetting( 'color.background', name );
	const [ isTextEnabled ] = useSetting( 'color.text', name );

	let textColorElementSelector = 'elements.' + element + '.color.text';
	const backgroundColorElementSelector =
		'elements.' + element + '.color.background';

	let hasElementColor = false;

	switch ( element ) {
		case 'button':
			hasElementColor =
				supports.includes( 'buttonColor' ) &&
				isBackgroundEnabled &&
				( solids.length > 0 || areCustomSolidsEnabled );
			break;
		case 'text':
			hasElementColor =
				supports.includes( 'color' ) &&
				isTextEnabled &&
				( solids.length > 0 || areCustomSolidsEnabled );
			textColorElementSelector = 'color.text';
			isBackgroundEnabled = false;
			break;

		default:
			hasElementColor =
				supports.includes( 'color' ) &&
				( solids.length > 0 || areCustomSolidsEnabled );
			break;
	}

	const [ elementTextColor, setElementTextColor ] = useStyle(
		textColorElementSelector,
		name
	);

	const [ userElementTextColor ] = useStyle(
		textColorElementSelector,
		name,
		'user'
	);

	const [ elementBgColor, setElementBgColor ] = useStyle(
		backgroundColorElementSelector,
		name
	);

	const [ userElementBgColor ] = useStyle(
		backgroundColorElementSelector,
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
			</div>
			{ isBackgroundEnabled && (
				<div className="edit-site-global-styles-screen-element-color">
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
			) }
		</>
	);
}

export default ScreenColorElement;
