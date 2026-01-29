/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import {
	applyFormat,
	removeFormat,
	getActiveFormat,
} from '@wordpress/rich-text';
import {
	getColorClassName,
	getColorObjectByColorValue,
	useMultipleOriginColorsAndGradients,
	useMobileGlobalStylesColors,
} from '@wordpress/block-editor';
import { BottomSheet, ColorSettings } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { transparentValue } from './index.js';
import { parseClassName } from './inline.js';

function parseCSS( css = '' ) {
	return css.split( ';' ).reduce( ( accumulator, rule ) => {
		if ( rule ) {
			const [ property, value ] = rule.replace( / /g, '' ).split( ':' );
			if ( property === 'color' ) {
				accumulator.color = value;
			}
			if (
				property === 'background-color' &&
				value !== transparentValue
			) {
				accumulator.backgroundColor = value;
			}
		}
		return accumulator;
	}, {} );
}

export function getActiveColors( value, name, colorSettings ) {
	const activeColorFormat = getActiveFormat( value, name );

	if ( ! activeColorFormat ) {
		return {};
	}

	return {
		...parseCSS( activeColorFormat.attributes.style ),
		...parseClassName( activeColorFormat.attributes.class, colorSettings ),
	};
}

function setColors( value, name, colorSettings, colors, contentRef ) {
	const { color, backgroundColor } = {
		...getActiveColors( value, name, colorSettings ),
		...colors,
	};

	if ( ! color ) {
		contentRef?.onRemoveMarkFormatting();
		return removeFormat( value, name );
	}

	const styles = [];
	const classNames = [];
	const attributes = {};

	if ( backgroundColor ) {
		styles.push( [ 'background-color', backgroundColor ].join( ':' ) );
	} else {
		// Override default browser color for mark element.
		styles.push( [ 'background-color', transparentValue ].join( ':' ) );
	}

	if ( color ) {
		const colorObject = getColorObjectByColorValue( colorSettings, color );

		if ( colorObject ) {
			classNames.push( getColorClassName( 'color', colorObject.slug ) );
			styles.push( [ 'color', colorObject.color ].join( ':' ) );
		} else {
			styles.push( [ 'color', color ].join( ':' ) );
		}
	}

	if ( styles.length ) {
		attributes.style = styles.join( ';' );
	}
	if ( classNames.length ) {
		attributes.class = classNames.join( ' ' );
	}

	const format = { type: name, attributes };
	const hasNoSelection = value.start === value.end;

	if ( hasNoSelection ) {
		contentRef?.onMarkFormatting( color );
	}
	return applyFormat( value, format );
}

function ColorPicker( { name, value, onChange, contentRef } ) {
	const property = 'color';
	const colors = useMobileGlobalStylesColors();
	const colorSettings = useMultipleOriginColorsAndGradients();
	colorSettings.allAvailableColors = colors;

	const onColorChange = useCallback(
		( color ) => {
			onChange(
				setColors(
					value,
					name,
					colors,
					{ [ property ]: color },
					contentRef
				)
			);
		},
		[ colors, contentRef, name, onChange, value ]
	);
	const activeColors = useMemo(
		() => getActiveColors( value, name, colors ),
		[ name, value, colors ]
	);

	return (
		<ColorSettings
			colorValue={ activeColors[ property ] }
			onColorChange={ onColorChange }
			onColorCleared={ onColorChange }
			defaultSettings={ colorSettings }
			hideNavigation
		/>
	);
}

export default function InlineColorUI( {
	name,
	value,
	onChange,
	onClose,
	contentRef,
} ) {
	return (
		<BottomSheet
			isVisible
			onClose={ onClose }
			hideHeader
			contentStyle={ { paddingLeft: 0, paddingRight: 0 } }
			hasNavigation
			leftButton={ null }
			testID="inline-text-color-modal"
		>
			<BottomSheet.NavigationContainer animate main>
				<BottomSheet.NavigationScreen name="text-color">
					<ColorPicker
						name={ name }
						value={ value }
						onChange={ onChange }
						contentRef={ contentRef }
					/>
				</BottomSheet.NavigationScreen>
			</BottomSheet.NavigationContainer>
		</BottomSheet>
	);
}
