import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import {
	RichTextToolbarButton,
	useSettings,
	// @ts-expect-error Block Editor not fully typed yet.
} from '@wordpress/block-editor';
import {
	Icon,
	color as colorIcon,
	textColor as textColorIcon,
} from '@wordpress/icons';
import { removeFormat } from '@wordpress/rich-text';
import type { ColorObject, TextColorEditProps } from '../types';
import { default as InlineColorUI, getActiveColors } from './inline';

export const transparentValue = 'rgba(0, 0, 0, 0)';

const name = 'core/text-color';
const title = __( 'Highlight' );

const EMPTY_ARRAY: ColorObject[] = [];

function getComputedStyleProperty( element: HTMLElement, property: string ) {
	const { ownerDocument } = element;
	const { defaultView } = ownerDocument;
	const style = defaultView?.getComputedStyle( element );
	const value = style?.getPropertyValue( property );

	if (
		property === 'background-color' &&
		value === transparentValue &&
		element.parentElement
	) {
		return getComputedStyleProperty( element.parentElement, property );
	}

	return value;
}

function fillComputedColors(
	element: HTMLElement | null,
	{ color, backgroundColor }: { color?: string; backgroundColor?: string }
) {
	// `element` is the editable content element, which is null before the
	// rich text mounts. There are no computed styles to read without it.
	if ( ! element || ( ! color && ! backgroundColor ) ) {
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
}: TextColorEditProps ) {
	const [ allowCustomControl, colors = EMPTY_ARRAY ] = useSettings(
		'color.custom',
		'color.palette'
	);
	const [ isAddingColor, setIsAddingColor ] = useState( false );
	const colorIndicatorStyle = useMemo(
		() =>
			fillComputedColors(
				contentRef.current,
				getActiveColors( value, name, colors )
			),
		[ contentRef, value, colors ]
	);

	const hasColorsToChoose = !! colors.length || allowCustomControl;
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
						icon={
							Object.keys( activeAttributes ).length
								? textColorIcon
								: colorIcon
						}
						style={ colorIndicatorStyle }
					/>
				}
				title={ title }
				// If has no colors to choose but a color is active remove the color onClick.
				onClick={
					hasColorsToChoose
						? () => setIsAddingColor( true )
						: () => onChange( removeFormat( value, name ) )
				}
				role="menuitemcheckbox"
			/>
			{ isAddingColor && (
				<InlineColorUI
					name={ name }
					onClose={ () => setIsAddingColor( false ) }
					value={ value }
					onChange={ onChange }
					contentRef={ contentRef }
					isActive={ isActive }
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
