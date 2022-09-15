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

function ScreenCaptionColor( { name } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const colorsPerOrigin = useColorsPerOrigin( name );
	const [ solids ] = useSetting( 'color.palette', name );
	const [ areCustomSolidsEnabled ] = useSetting( 'color.custom', name );

	const hasCaptionColor =
		supports.includes( 'color' ) &&
		( solids.length > 0 || areCustomSolidsEnabled );

	const [ captionTextColor, setCaptionTextColor ] = useStyle(
		'elements.caption.color.text',
		name
	);
	const [ userCaptionTextColor ] = useStyle(
		'elements.caption.color.text',
		name,
		'user'
	);

	const [ captionBgColor, setCaptionBgColor ] = useStyle(
		'elements.caption.color.background',
		name
	);
	const [ userCaptionBgColor ] = useStyle(
		'elements.caption.color.background',
		name,
		'user'
	);

	if ( ! hasCaptionColor ) {
		return null;
	}

	return (
		<>
			<ScreenHeader
				title={ __( 'Captions' ) }
				description={ __(
					'Set the colors used for captions across the site.'
				) }
			/>
			<div className="edit-site-global-styles-screen-caption-color">
				<h4>{ __( 'Text color' ) }</h4>

				<ColorGradientControl
					className="edit-site-screen-caption-color__control"
					colors={ colorsPerOrigin }
					disableCustomColors={ ! areCustomSolidsEnabled }
					__experimentalHasMultipleOrigins
					showTitle={ false }
					enableAlpha
					__experimentalIsRenderedInSidebar
					colorValue={ captionTextColor }
					onColorChange={ setCaptionTextColor }
					clearable={ captionTextColor === userCaptionTextColor }
				/>

				<h4>{ __( 'Background color' ) }</h4>

				<ColorGradientControl
					className="edit-site-screen-caption-color__control"
					colors={ colorsPerOrigin }
					disableCustomColors={ ! areCustomSolidsEnabled }
					__experimentalHasMultipleOrigins
					showTitle={ false }
					enableAlpha
					__experimentalIsRenderedInSidebar
					colorValue={ captionBgColor }
					onColorChange={ setCaptionBgColor }
					clearable={ captionBgColor === userCaptionBgColor }
				/>
			</div>
		</>
	);
}

export default ScreenCaptionColor;
