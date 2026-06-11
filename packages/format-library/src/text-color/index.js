/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { RichTextToolbarButton, useSettings } from '@wordpress/block-editor';
import {
	Icon,
	background as backgroundColorIcon,
	textColor as textColorIcon,
} from '@wordpress/icons';
import { removeFormat } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { default as InlineColorUI, getActiveColors } from './inline';

export const transparentValue = 'rgba(0, 0, 0, 0)';

const name = 'core/text-color';
const title = __( 'Text color' );
const backgroundTitle = __( 'Background color' );

const EMPTY_ARRAY = [];

function getComputedStyleProperty( element, property ) {
	const { ownerDocument } = element;
	const { defaultView } = ownerDocument;
	const style = defaultView.getComputedStyle( element );
	const value = style.getPropertyValue( property );

	if (
		property === 'background-color' &&
		value === transparentValue &&
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
			backgroundColor === transparentValue
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
	const [ allowCustomControl, colors = EMPTY_ARRAY ] = useSettings(
		'color.custom',
		'color.palette'
	);
	const [ activeTab, setActiveTab ] = useState( null );
	const activeColors = useMemo(
		() => getActiveColors( value, name, colors ),
		[ value, colors ]
	);
	const textColorIndicatorStyle = useMemo(
		() =>
			fillComputedColors( contentRef.current, {
				color: activeColors.color,
				backgroundColor: undefined,
			} ),
		[ contentRef, activeColors ]
	);
	const highlightColorIndicatorStyle = useMemo(
		() =>
			activeColors.backgroundColor
				? { color: activeColors.backgroundColor }
				: undefined,
		[ activeColors ]
	);

	const hasColorsToChoose = !! colors.length || allowCustomControl;
	if ( ! hasColorsToChoose && ! isActive ) {
		return null;
	}

	const isTextColorActive = !! activeColors.color;
	const isHighlightColorActive = !! activeColors.backgroundColor;

	return (
		<>
			<RichTextToolbarButton
				className="format-library-text-color-button"
				isActive={ isTextColorActive }
				icon={
					<Icon
						icon={ textColorIcon }
						style={ textColorIndicatorStyle }
					/>
				}
				title={ title }
				// If has no colors to choose but a color is active remove the color onClick.
				onClick={
					hasColorsToChoose
						? () => setActiveTab( 'color' )
						: () => onChange( removeFormat( value, name ) )
				}
				role="menuitemcheckbox"
			/>
			<RichTextToolbarButton
				isActive={ isHighlightColorActive }
				icon={
					<Icon
						icon={ backgroundColorIcon }
						style={ highlightColorIndicatorStyle }
					/>
				}
				title={ backgroundTitle }
				// If has no colors to choose but a color is active remove the color onClick.
				onClick={
					hasColorsToChoose
						? () => setActiveTab( 'backgroundColor' )
						: () => onChange( removeFormat( value, name ) )
				}
				role="menuitemcheckbox"
			/>
			{ activeTab !== null && (
				<InlineColorUI
					name={ name }
					onClose={ () => setActiveTab( null ) }
					activeAttributes={ activeAttributes }
					value={ value }
					onChange={ onChange }
					contentRef={ contentRef }
					isActive={ isActive }
					defaultTab={ activeTab }
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
