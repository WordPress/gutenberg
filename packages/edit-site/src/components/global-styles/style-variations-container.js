/**
 * External dependencies
 */
import classnames from 'classnames';
import deepmerge from 'deepmerge';

/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useContext, useState } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import {
	FlexBlock,
	__experimentalGrid as Grid,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from './global-styles-provider';
import StylesPreview from './preview';
import CustomColor from './custom-color';
import { unlock } from '../../lock-unlock';

function hexToHSL( H ) {
	// Convert hex to RGB first
	let r = 0,
		g = 0,
		b = 0;
	if ( H.length == 4 ) {
		r = '0x' + H[ 1 ] + H[ 1 ];
		g = '0x' + H[ 2 ] + H[ 2 ];
		b = '0x' + H[ 3 ] + H[ 3 ];
	} else if ( H.length == 7 ) {
		r = '0x' + H[ 1 ] + H[ 2 ];
		g = '0x' + H[ 3 ] + H[ 4 ];
		b = '0x' + H[ 5 ] + H[ 6 ];
	}
	// Then to HSL
	r /= 255;
	g /= 255;
	b /= 255;
	let cmin = Math.min( r, g, b ),
		cmax = Math.max( r, g, b ),
		delta = cmax - cmin,
		h = 0,
		s = 0,
		l = 0;

	if ( delta == 0 ) h = 0;
	else if ( cmax == r ) h = ( ( g - b ) / delta ) % 6;
	else if ( cmax == g ) h = ( b - r ) / delta + 2;
	else h = ( r - g ) / delta + 4;

	h = Math.round( h * 60 );

	if ( h < 0 ) h += 360;

	l = ( cmax + cmin ) / 2;
	s = delta == 0 ? 0 : delta / ( 1 - Math.abs( 2 * l - 1 ) );
	s = +( s * 100 ).toFixed( 1 );
	l = +( l * 100 ).toFixed( 1 );

	return [ h, s, l ];
}

function generateColorShades( color, hsl, graySat ) {
	return [
		{
			color: `hsl(${ hsl[ 0 ] }, ${ hsl[ 1 ] }%, 98%)`,
			name: `${ color } Lighter`,
			slug: `${ color.toLowerCase() }-lighter`,
		},
		{
			color: `hsl(${ hsl[ 0 ] }, ${ hsl[ 1 ] }%, 85%)`,
			name: `${ color } Light`,
			slug: `${ color.toLowerCase() }-light`,
		},
		{
			color: `hsl(${ hsl[ 0 ] }, ${ hsl[ 1 ] }%, 40%)`,
			name: `${ color } Accent`,
			slug: `${ color.toLowerCase() }-accent`,
		},
		{
			color: `hsl(${ hsl[ 0 ] }, ${ hsl[ 1 ] }%, 15%)`,
			name: `${ color } Dark`,
			slug: `${ color.toLowerCase() }-dark`,
		},
		{
			color: `hsl(${ hsl[ 0 ] }, ${ hsl[ 1 ] }%, 3%)`,
			name: `${ color } Darker`,
			slug: `${ color.toLowerCase() }-darker`,
		},
		{
			color: `hsl(${ hsl[ 0 ] }, ${ graySat }, 100%)`,
			name: `Gray Lighter`,
			slug: `gray-lighter`,
		},
		{
			color: `hsl(${ hsl[ 0 ] }, ${ graySat }, 85%)`,
			name: `Gray Light`,
			slug: `gray-light`,
		},
		{
			color: `hsl(${ hsl[ 0 ] }, ${ graySat }, 15%)`,
			name: `Gray Dark`,
			slug: `gray-dark`,
		},
		{
			color: `hsl(${ hsl[ 0 ] }, ${ graySat }, 4%)`,
			name: `Gray Darker`,
			slug: `gray-darker`,
		},
	];
}

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );

function Variation( { variation, onSelect, isActive } ) {
	const [ isFocused, setIsFocused ] = useState( false );
	const { base } = useContext( GlobalStylesContext );
	const context = useMemo( () => {
		return {
			user: {
				settings: variation.settings ?? {},
				styles: variation.styles ?? {},
			},
			base,
			merged: mergeBaseAndUserConfigs( base, variation ),
			setUserConfig: () => {},
		};
	}, [ variation, base ] );

	const selectVariation = () => {
		onSelect( variation );
	};

	const selectOnEnter = ( event ) => {
		if ( event.keyCode === ENTER ) {
			event.preventDefault();
			selectVariation();
		}
	};

	let label = variation?.title;
	if ( variation?.description ) {
		label = sprintf(
			/* translators: %1$s: variation title. %2$s variation description. */
			__( '%1$s (%2$s)' ),
			variation?.title,
			variation?.description
		);
	}

	return (
		<GlobalStylesContext.Provider value={ context }>
			<div
				className={ classnames(
					'edit-site-global-styles-variations_item',
					{
						'is-active': isActive,
					}
				) }
				role="button"
				onClick={ selectVariation }
				onKeyDown={ selectOnEnter }
				tabIndex="0"
				aria-label={ label }
				aria-current={ isActive }
				onFocus={ () => setIsFocused( true ) }
				onBlur={ () => setIsFocused( false ) }
			>
				<div className="edit-site-global-styles-variations_item-preview">
					<StylesPreview
						label={ variation?.title }
						isFocused={ isFocused }
						withHoverView
					/>
				</div>
			</div>
		</GlobalStylesContext.Provider>
	);
}

export default function StyleVariationsContainer() {
	const [ selectedColor, setSelectedColor ] = useState( {} );
	const [ selectedFont, setSelectedFont ] = useState( {} );
	const [ customColor, setCustomColor ] = useState( 'rgba(255,255,255,.4)' );

	const { setUserConfig } = useContext( GlobalStylesContext );

	const variations = useSelect( ( select ) => {
		return select(
			coreStore
		).__experimentalGetCurrentThemeGlobalStylesVariations();
	}, [] );

	const withEmptyVariation = useMemo( () => {
		return [
			{
				title: __( 'Default' ),
				settings: {},
				styles: {},
			},
			...( variations ?? [] ).map( ( variation ) => ( {
				...variation,
				settings: variation.settings ?? null,
				styles: variation.styles ?? null,
			} ) ),
		];
	}, [ variations ] );

	const colorVariations = withEmptyVariation.filter( ( variation ) =>
		variation.title.includes( 'Color/' )
	);
	const fontVariations = withEmptyVariation.filter( ( variation ) =>
		variation.title.includes( 'Font/' )
	);

	const handleFontSelect = ( variation ) => {
		setSelectedFont( variation );
		const mergedSelectedVariation = deepmerge( selectedColor, variation );
		setUserConfig( () => {
			return {
				settings: mergedSelectedVariation.settings,
				styles: mergedSelectedVariation.styles,
			};
		} );
	};

	const handleColorSelect = ( variation ) => {
		setSelectedColor( variation );
		const mergedSelectedVariation = deepmerge( variation, selectedFont );
		setUserConfig( () => {
			return {
				settings: mergedSelectedVariation.settings,
				styles: mergedSelectedVariation.styles,
			};
		} );
	};

	const handleCustomColor = ( color ) => {
		setCustomColor( color );
		const hslColor = hexToHSL( color );
		const graySaturation = '5%';
		const name = 'theme-1';
		const palette = generateColorShades( name, hslColor, graySaturation );
		const newColor = {
			settings: {
				color: { palette: { theme: palette } },
			},
			styles: {
				color: {
					background: 'var(--wp--preset--color--theme-1-lighter)',
					text: 'var(--wp--preset--color--accent-dark)',
				},
				elements: {
					button: {
						color: {
							background:
								'var(--wp--preset--color--theme-1-accent)',
							text: 'var(--wp--preset--color--theme-1-lighter)',
						},
					},
					heading: {
						color: {
							text: 'var(--wp--preset--color--darker)',
						},
					},
				},
			},
		};
		const mergedSelectedVariation = deepmerge( selectedFont, newColor );
		setUserConfig( () => {
			return {
				settings: mergedSelectedVariation.settings,
				styles: mergedSelectedVariation.styles,
			};
		} );
	};

	return (
		<VStack spacing={ 5 }>
			<VStack spacing={ 2 }>
				<HStack alignment="center">
					<FlexBlock>
						<Heading upperCase={ true } level={ 5 }>
							Colors
						</Heading>
					</FlexBlock>
				</HStack>
				<Grid
					columns={ 2 }
					className="edit-site-global-styles-style-variations-container"
				>
					<CustomColor
						color={ customColor }
						onSelect={ handleCustomColor }
					/>
					{ colorVariations.map( ( variation, index ) => (
						<Variation
							key={ index }
							variation={ variation }
							onSelect={ handleColorSelect }
							isActive={
								variation.title === selectedColor?.title
							}
						/>
					) ) }
				</Grid>
			</VStack>
			<VStack spacing={ 2 }>
				<Heading upperCase={ true } level={ 5 }>
					Fonts
				</Heading>
				<Grid>
					{ fontVariations.map( ( variation, index ) => (
						<Variation
							key={ index }
							variation={ variation }
							onSelect={ handleFontSelect }
							isActive={ variation.title !== selectedFont?.title }
						/>
					) ) }
				</Grid>
			</VStack>
		</VStack>
	);
}
