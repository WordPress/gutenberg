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

const DEMO_TEXT = 'The quick brown fox jumps over the lazy dog';

function FontFaceItem( { title, fontFace, actionTrigger } ) {
	useEffect( () => {
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
	}, [ fontFace ] );

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

	return (
		<Surface variant="primary">
			<Surface style={ headContainerStyles }>
				<HStack justify="space-between">
					<Text>
						{ title ||
							`${ fontFace.fontFamily } ${ fontFace.fontStyle } ${ fontFace.fontWeight }` }
					</Text>
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
