/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { RichTextToolbarButton, useSetting } from '@wordpress/block-editor';
import { Icon, textColor as textColorIcon } from '@wordpress/icons';
import { removeFormat } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { default as InlineColorUI, getActiveColors } from './inline';

const name = 'core/text-color';
const title = __( 'Text color' );

const EMPTY_ARRAY = [];

function TextColorEdit( {
	value,
	onChange,
	isActive,
	activeAttributes,
	contentRef,
} ) {
	const allowCustomControl = useSetting( 'color.custom' );
	const colors = useSetting( 'color.palette' ) || EMPTY_ARRAY;
	const [ isAddingColor, setIsAddingColor ] = useState( false );
	const enableIsAddingColor = useCallback( () => setIsAddingColor( true ), [
		setIsAddingColor,
	] );
	const disableIsAddingColor = useCallback( () => setIsAddingColor( false ), [
		setIsAddingColor,
	] );
	const colorIndicatorStyle = useMemo( () => {
		const color = getActiveColors( value, name, colors )?.color;

		return { color: color?.replace( ' ', '' ) };
	} );

	const hasColorsToChoose = ! isEmpty( colors ) || ! allowCustomControl;
	if ( ! hasColorsToChoose && ! isActive ) {
		return null;
	}

	return (
		<>
			<RichTextToolbarButton
				className="format-library-text-color-button"
				isActive={ isActive }
				icon={
					<Icon
						icon={ textColorIcon }
						style={
							colorIndicatorStyle?.color && colorIndicatorStyle
						}
					/>
				}
				title={ title }
				// If has no colors to choose but a color is active remove the color onClick
				onClick={
					hasColorsToChoose
						? enableIsAddingColor
						: () => onChange( removeFormat( value, name ) )
				}
			/>
			{ isAddingColor && (
				<InlineColorUI
					name={ name }
					onClose={ disableIsAddingColor }
					activeAttributes={ activeAttributes }
					value={ value }
					onChange={ onChange }
					contentRef={ contentRef }
				/>
			) }
		</>
	);
}

export const textColor = {
	name,
	title,
	tagName: 'mark',
	className: 'has-inline-color',
	attributes: {
		style: 'style',
		class: 'class',
	},
	/*
	 * Since this format relies on the <mark> tag, it's important to
	 * prevent the default yellow background color applied by most
	 * browsers. The solution is to detect when this format is used with a
	 * text color but no background color, and in such cases to override
	 * the default styling with a transparent background.
	 *
	 * @see https://github.com/WordPress/gutenberg/pull/35516
	 */
	__unstableFilterAttributeValue( key, value ) {
		if ( key !== 'style' ) return value;
		// We should not add a background-color if it's already set
		if ( value && value.includes( 'background-color' ) ) return value;
		const addedCSS = [ 'background-color', 'rgba(0, 0, 0, 0)' ].join( ':' );
		// Prepend `addedCSS` to avoid a double `;;` as any the existing CSS
		// rules will already include a `;`.
		return value ? [ addedCSS, value ].join( ';' ) : addedCSS;
	},
	edit: TextColorEdit,
};
