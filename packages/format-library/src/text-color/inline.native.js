/**
 * External dependencies
 */
import { get } from 'lodash';
import { Text } from 'react-native';

/**
 * WordPress dependencies
 */
/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	applyFormat,
	removeFormat,
	getActiveFormat,
	useAnchorRef,
} from '@wordpress/rich-text';
import {
	ColorPalette,
	getColorClassName,
	getColorObjectByColorValue,
	getColorObjectByAttributeValues,
	store as blockEditorStore,
	useSetting,
} from '@wordpress/block-editor';
import {
	BottomSheet,
	BottomSheetConsumer,
	ColorSettings,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
/**
 * Internal dependencies
 */
import { textColor as settings } from './index';

function parseCSS( css = '' ) {
	return css.split( ';' ).reduce( ( accumulator, rule ) => {
		if ( rule ) {
			const [ property, value ] = rule.split( ':' );
			if ( property === 'color' ) accumulator.color = value;
			if ( property === 'background-color' )
				accumulator.backgroundColor = value;
		}
		return accumulator;
	}, {} );
}

function parseClassName( className = '', colorSettings ) {
	return className.split( ' ' ).reduce( ( accumulator, name ) => {
		const match = name.match( /^has-([^-]+)-color$/ );
		if ( match ) {
			const [ , colorSlug ] = name.match( /^has-([^-]+)-color$/ );
			const colorObject = getColorObjectByAttributeValues(
				colorSettings,
				colorSlug
			);
			accumulator.color = colorObject.color;
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

function setColors( value, name, colorSettings, colors ) {
	const { color, backgroundColor } = {
		// ...getActiveColors( value, name, colorSettings ),
		...colors,
	};

	// if ( ! color && ! backgroundColor ) {
	// 	return removeFormat( value, name );
	// }

	const styles = [];
	const classNames = [];
	const attributes = {};

	// if ( backgroundColor ) {
	// 	styles.push( [ 'background-color', backgroundColor ].join( ':' ) );
	// } else {
	// 	// Override default browser color for mark element.
	// 	styles.push( [ 'background-color', 'rgba(0, 0, 0, 0)' ].join( ':' ) );
	// }

	if ( color ) {
		const colorObject = null;
		// const colorObject = getColorObjectByColorValue( colorSettings, color );

		if ( colorObject ) {
			classNames.push( getColorClassName( 'color', colorObject.slug ) );
		} else {
			styles.push( [ 'color', color ].join( ':' ) );
		}
	}

	if ( styles.length ) attributes.style = styles.join( ';' );
	if ( classNames.length ) attributes.class = classNames.join( ' ' );
	console.log( value );
	console.log( name );
	console.log( attributes );
	return applyFormat( value, { type: name, attributes } );
}

function ColorPicker( { name, value, onChange } ) {
	const property = 'color';
	const colorSettings = {
		colors: useSetting( 'color.palette' ) || settings.colors,
		gradients: useSetting( 'color.gradients' ) || settings.gradients,
	};

	const colors = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return get( getSettings(), [ 'colors' ], [] );
	} );
	const onColorChange = useCallback(
		( color ) => {
			console.log( color );
			onChange(
				setColors( value, name, colors, { [ property ]: color } )
			);
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
		/>
	);

	// return (
	// 	<ColorPalette
	// 		value={ activeColors[ property ] }
	// 		onChange={ onColorChange }
	// 	/>
	// );
}

export default function InlineColorUI( {
	name,
	value,
	onChange,
	onClose,
	contentRef,
} ) {
	const anchorRef = useAnchorRef( { ref: contentRef, value, settings } );

	return (
		<BottomSheet
			isVisible
			onClose={ onClose }
			hideHeader
			contentStyle={ { paddingLeft: 0, paddingRight: 0 } }
			hasNavigation
			// contentStyle={ styles.contentStyle }
			// leftButton={ leftButton }
		>
			<BottomSheet.NavigationContainer animate main>
				<BottomSheet.NavigationScreen name={ 'text-color' }>
					<ColorPicker
						name={ name }
						value={ value }
						onChange={ onChange }
					/>
				</BottomSheet.NavigationScreen>
			</BottomSheet.NavigationContainer>
		</BottomSheet>
	);

	// return (
	// 	<Popover
	// 		onClose={ onClose }
	// 		className="components-inline-color-popover"
	// 		anchorRef={ anchorRef }
	// 	>
	// 		<TabPanel
	// 			tabs={ [
	// 				{
	// 					name: 'color',
	// 					title: __( 'Text' ),
	// 				},
	// 				{
	// 					name: 'backgroundColor',
	// 					title: __( 'Background' ),
	// 				},
	// 			] }
	// 		>
	// 			{ ( tab ) => (
	// 				<ColorPicker
	// 					name={ name }
	// 					property={ tab.name }
	// 					value={ value }
	// 					onChange={ onChange }
	// 				/>
	// 			) }
	// 		</TabPanel>
	// 	</Popover>
	// );
}
