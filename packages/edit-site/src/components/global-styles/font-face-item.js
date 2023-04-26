/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalSurface as Surface,
	__experimentalText as Text,
	FlexItem,
} from '@wordpress/components';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FONT_WEIGHTS, FONT_STYLES } from '../../../../block-editor/src/components/global-styles/typography-utils';

const DEMO_TEXT = 'The quick brown fox jumps over the lazy dog';

function FontFaceItem( { title, fontFace, actionTrigger } ) {
	useEffect( () => {
		// Load font asset in the broser
		if ( fontFace.url ) {
			// eslint-disable-next-line no-undef
			const newFont = new FontFace(
				fontFace.fontFamily,
				`url(${ fontFace.url })`,
				{ style: fontFace.fontStyle, weight: fontFace.fontWeight }
			);
			newFont.load().then( function ( loadedFace ) {
				document.fonts.add( loadedFace );
			} );
		}
	}, [] );

	const headContainerStyles = {
		padding: '8px 16px',
	};

	const textContainerStyles = {
		padding: '16px',
	};

	const demoTextstyles = {
		fontFamily: fontFace.fontFamily,
		fontWeight: fontFace.fontWeight,
		fontStyle: fontFace.fontStyle,
		fontSize: '1.2rem',
		lineHeight: '1em',
		paddingTop: '16px',
	};

	const weightTitle =
		FONT_WEIGHTS[ fontFace.fontWeight ] || fontFace.fontWeight;
	const styleTitle =
		fontFace.fontStyle !== 'normal'
			? FONT_STYLES[ fontFace.fontStyle ] || fontFace.fontStyle
			: '';
	const defaultTitle = `${ weightTitle } ${ styleTitle }`;

	return (
		<Surface variant="primary">
			<Surface style={ headContainerStyles }>
				<HStack justify="space-between">
					<Text>{ title || defaultTitle }</Text>
					{ actionTrigger && <FlexItem>{ actionTrigger }</FlexItem> }
				</HStack>
			</Surface>
			<Surface variant="grid" style={ textContainerStyles }>
				<Text style={ demoTextstyles }>{ DEMO_TEXT }</Text>
			</Surface>
		</Surface>
	);
}

export default FontFaceItem;
