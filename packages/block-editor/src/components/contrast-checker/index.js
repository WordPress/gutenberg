/**
 * External dependencies
 */
import tinycolor from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/components';
import { useEffect } from '@wordpress/element';

function ContrastCheckerMessage( { tinyBackgroundColor, tinyTextColor, backgroundColor, textColor } ) {
	const msg = tinyBackgroundColor.getBrightness() < tinyTextColor.getBrightness() ?
		__( 'This color combination may be hard for people to read. Try using a darker background color and/or a brighter text color.' ) :
		__( 'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.' );
	useEffect( () => {
		speak( __( 'This color combination may be hard for people to read.' ) );
	}, [ backgroundColor, textColor ] );
	return (
		<div className="editor-contrast-checker block-editor-contrast-checker">
			<Notice status="warning" isDismissible={ false }>
				{ msg }
			</Notice>
		</div>
	);
}

function ContrastChecker( {
	backgroundColor,
	fallbackBackgroundColor,
	fallbackTextColor,
	fontSize, // font size value in pixels
	isLargeText,
	textColor,
} ) {
	if ( ! ( backgroundColor || fallbackBackgroundColor ) || ! ( textColor || fallbackTextColor ) ) {
		return null;
	}
	const tinyBackgroundColor = tinycolor( backgroundColor || fallbackBackgroundColor );
	const tinyTextColor = tinycolor( textColor || fallbackTextColor );
	const hasTransparency = tinyBackgroundColor.getAlpha() !== 1 || tinyTextColor.getAlpha() !== 1;

	if ( hasTransparency || tinycolor.isReadable(
		tinyBackgroundColor,
		tinyTextColor,
		{ level: 'AA', size: ( isLargeText || ( isLargeText !== false && fontSize >= 24 ) ? 'large' : 'small' ) }
	) ) {
		return null;
	}

	return (
		<ContrastCheckerMessage
			backgroundColor={ backgroundColor }
			textColor={ textColor }
			tinyBackgroundColor={ tinyBackgroundColor }
			tinyTextColor={ tinyTextColor }
		/>
	);
}

export default ContrastChecker;
