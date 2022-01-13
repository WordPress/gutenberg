/**
 * External dependencies
 */
import { get } from 'lodash';

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
	useCachedTruthy,
} from '@wordpress/block-editor';
import { Popover, TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { textColor as settings, transparentValue } from './index';

function parseCSS( css = '' ) {
	return css.split( ';' ).reduce( ( accumulator, rule ) => {
		if ( rule ) {
			const [ property, value ] = rule.split( ':' );
			if ( property === 'color' ) accumulator.color = value;
			if ( property === 'background-color' && value !== transparentValue )
				accumulator.backgroundColor = value;
		}
		return accumulator;
	}, {} );
}

export function parseClassName( className = '', colorSettings ) {
	return className.split( ' ' ).reduce( ( accumulator, name ) => {
		// `colorSlug` could contain dashes, so simply match the start and end.
		if ( name.startsWith( 'has-' ) && name.endsWith( '-color' ) ) {
			const colorSlug = name
				.replace( /^has-/, '' )
				.replace( /-color$/, '' );
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
		} else {
			styles.push( [ 'color', color ].join( ':' ) );
		}
	}

	if ( styles.length ) attributes.style = styles.join( ';' );
	if ( classNames.length ) attributes.class = classNames.join( ' ' );

	return applyFormat( value, { type: name, attributes } );
}

function ColorPicker( { name, property, value, onChange } ) {
	const colors = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return get( getSettings(), [ 'colors' ], [] );
	}, [] );
	const onColorChange = useCallback(
		( color ) => {
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
		<ColorPalette
			value={ activeColors[ property ] }
			onChange={ onColorChange }
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
	/* 
	 As you change the text color by typing a HEX value into a field,
	 the return value of document.getSelection jumps to the field you're editing,
	 not the highlighted text. Given that useAnchorRef uses document.getSelection,
	 it will return null, since it can't find the <mark> element within the HEX input.
	 This caches the last truthy value of the selection anchor reference.
	 */
	const anchorRef = useCachedTruthy(
		useAnchorRef( { ref: contentRef, value, settings } )
	);

	return (
		<Popover
			onClose={ onClose }
			className="components-inline-color-popover"
			anchorRef={ anchorRef }
		>
			<TabPanel
				tabs={ [
					{
						name: 'color',
						title: __( 'Text' ),
					},
					{
						name: 'backgroundColor',
						title: __( 'Background' ),
					},
				] }
			>
				{ ( tab ) => (
					<ColorPicker
						name={ name }
						property={ tab.name }
						value={ value }
						onChange={ onChange }
					/>
				) }
			</TabPanel>
		</Popover>
	);
}
