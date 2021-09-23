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
const title = __( 'Highlight' );

const EMPTY_ARRAY = [];

function getComputedStyleProperty( element, property ) {
	const { ownerDocument } = element;
	const { defaultView } = ownerDocument;
	const style = defaultView.getComputedStyle( element );
	const value = style.getPropertyValue( property );

	if (
		property === 'background-color' &&
		value === 'rgba(0, 0, 0, 0)' &&
		element.parentElement
	) {
		return getComputedStyleProperty( element.parentElement, property );
	}

	return value;
}

function fillComputedColors( element, { color, backgroundColor } ) {
	if ( ! color && ! backgroundColor ) {
		return;
	}

	return {
		color: color || getComputedStyleProperty( element, 'color' ),
		backgroundColor:
			backgroundColor === 'rgba(0, 0, 0, 0)'
				? getComputedStyleProperty( element, 'background-color' )
				: backgroundColor,
	};
}

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
	const colorIndicatorStyle = useMemo(
		() =>
			fillComputedColors(
				contentRef.current,
				getActiveColors( value, name, colors )
			),
		[ value, colors ]
	);

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
						style={ colorIndicatorStyle }
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
	edit: TextColorEdit,
};
