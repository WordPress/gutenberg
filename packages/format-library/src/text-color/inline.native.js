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
	useSetting,
	getColorClassName,
	getColorObjectByColorValue,
} from '@wordpress/block-editor';
import { BottomSheet, ColorSettings } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { textColor as settings } from './index';
import { transparentValue } from './index.js';
import { parseClassName } from './inline.js';

function parseCSS( css = '' ) {
	return css.split( ';' ).reduce( ( accumulator, rule ) => {
		if ( rule ) {
			const [ property, value ] = rule.replace( / /g, '' ).split( ':' );
			if ( property === 'color' ) accumulator.color = value;
			if ( property === 'background-color' && value !== transparentValue )
				accumulator.backgroundColor = value;
		}
		return accumulator;
	}, {} );
}

function getActiveColors( value, name, colorSettings ) {
	const activeColorFormat = getActiveFormat( value, name );

	if ( ! activeColorFormat ) {
		return {};
	}

	return {
		...parseCSS( activeColorFormat.attributes.style ),
		...parseClassName( activeColorFormat.attributes.class, colorSettings ),
	};
}

function setColors( value, name, colorSettings, colors ) {
	const { color, backgroundColor } = {
		...getActiveColors( value, name, colorSettings ),
		...colors,
	};

	if ( ! color && ! backgroundColor ) {
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

	if ( styles.length ) attributes.style = styles.join( ';' );
	if ( classNames.length ) attributes.class = classNames.join( ' ' );

	const format = { type: name, attributes };

	// For cases when there is no text selected, formatting is forced
	// for the first empty character
	if (
		value?.start === value?.end &&
		( value?.text.length === 0 ||
			value.text?.charAt( value.end - 1 ) === ' ' )
	) {
		return applyFormat( value, format, value?.start - 1, value?.end + 1 );
	}

	return applyFormat( value, format );
}

function ColorPicker( { name, value, onChange } ) {
	const property = 'color';
	const colors = useSetting( 'color.palette' ) || settings.colors;
	const colorSettings = {
		colors,
	};

	const onColorChange = useCallback(
		( color ) => {
			if ( color !== '' ) {
				onChange(
					setColors( value, name, colors, { [ property ]: color } )
				);
				// Remove formatting if the color was reset, there's no
				// current selection and the previous character is a space
			} else if (
				value?.start === value?.end &&
				value.text?.charAt( value?.end - 1 ) === ' '
			) {
				onChange(
					removeFormat( value, name, value.end - 1, value.end )
				);
			} else {
				onChange( removeFormat( value, name ) );
			}
		},
		[ colors, onChange, property ]
	);
	const activeColors = useMemo(
		() => getActiveColors( value, name, colors ),
		[ name, value, colors ]
	);

	return (
		<ColorSettings
			colorValue={ activeColors[ property ] }
			onColorChange={ onColorChange }
			defaultSettings={ colorSettings }
			hideNavigation
		/>
	);
}

export default function InlineColorUI( { name, value, onChange, onClose } ) {
	return (
		<BottomSheet
			isVisible
			onClose={ onClose }
			hideHeader
			contentStyle={ { paddingLeft: 0, paddingRight: 0 } }
			hasNavigation
			leftButton={ null }
		>
			<BottomSheet.NavigationContainer animate main>
				<BottomSheet.NavigationScreen name="text-color">
					<ColorPicker
						name={ name }
						value={ value }
						onChange={ onChange }
					/>
				</BottomSheet.NavigationScreen>
			</BottomSheet.NavigationContainer>
		</BottomSheet>
	);
}
