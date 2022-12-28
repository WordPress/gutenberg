/**
 * External dependencies
 */
import { useSpring, animated } from '@react-spring/web';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
import {
	Tooltip,
	Button,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';
import { useMemo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Subtitle from './subtitle';
import { useFontFamilies } from './hooks';
import FontFaceItem from './font-face-item';

function RemovableFontFace( { fontFace } ) {
	const { handleRemoveFontFace } = useFontFamilies();
	const [ springs, api ] = useSpring( () => ( {
		from: { y: 0, opacity: 1 },
	} ) );

	useEffect( () => {
		if ( ! fontFace.shouldBeRemoved ) {
			api.start( { y: 0, opacity: 1 } );
		}
	}, [ fontFace ] );

	const handleRemove = () => {
		api.start( { y: -20, opacity: 0 } );
		const timer = setTimeout( () => {
			handleRemoveFontFace(
				fontFace.fontFamily,
				fontFace.fontWeight,
				fontFace.fontStyle
			);
			return () => clearTimeout( timer );
		}, 200 );
	};

	if ( fontFace.shouldBeRemoved ) {
		return null;
	}

	return (
		<animated.div style={ springs }>
			<FontFaceItem
				fontFace={ fontFace }
				actionTrigger={
					<Tooltip text={ __( 'Remove Font Face' ) } delay={ 0 }>
						<Button
							style={ { padding: '0 8px' } }
							onClick={ handleRemove }
						>
							<Icon icon={ check } size={ 20 } />
						</Button>
					</Tooltip>
				}
			/>
		</animated.div>
	);
}

function ScreenThemeFontFacesList( { themeFontSelected } ) {
	const { goBack } = useNavigator();
	const { fontFamilies, sortFontFaces } = useFontFamilies();
	const font = fontFamilies[ themeFontSelected ];
	const getFontFaces = ( fontFamily ) => {
		return sortFontFaces( fontFamily.fontFace || [] );
	};
	const fontFaces = useMemo( () => getFontFaces( font ), [ fontFamilies ] );

	useEffect( () => {
		// Go Back if no font faces are available
		// This can happen if all font faces are flagged as shouldBeRemoved and the change is saved.
		// After the change is saved, the font faces are removed from the font family and the font faces are no longer available.
		if ( ! fontFaces.length ) {
			goBack();
		}
	}, [ fontFamilies ] );

	return (
		<>
			<ScreenHeader
				title={ __( 'Font Variants' ) }
				description={ __( 'Variants of the selected font family' ) }
			/>

			<div
				style={ {
					background: '#eee',
					padding: '1rem',
					display: 'flex',
					flexDirection: 'column',
					gap: '1rem',
				} }
			>
				{ font && (
					<Subtitle>
						{ ( font.name || font.fontFamily ) +
							__( ' variants:' ) }
					</Subtitle>
				) }

				{ ! font && <p>{ __( 'No font faces available' ) }</p> }

				{ fontFaces.map( ( fontFace, i ) => (
					<RemovableFontFace
						fontFace={ fontFace }
						key={ `fontface-${ i }` }
					/>
				) ) }
			</div>
		</>
	);
}

export default ScreenThemeFontFacesList;
