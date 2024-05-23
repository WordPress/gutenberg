/**
 * External dependencies
 */
import { StyleSheet, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from '@wordpress/element';
import {
	BlockControls,
	useSettings,
	useMobileGlobalStylesColors,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import {
	Icon,
	color as colorIcon,
	textColor as textColorIcon,
} from '@wordpress/icons';
import { removeFormat } from '@wordpress/rich-text';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getActiveColors } from './inline.native.js';
import { default as InlineColorUI } from './inline';
import styles from './style.scss';

const name = 'core/text-color';
const title = __( 'Text color' );

function getComputedStyleProperty( element, property ) {
	const style = element?.props?.style ?? {};

	if ( property === 'background-color' ) {
		const { backgroundColor, baseColors } = style;

		if ( backgroundColor !== 'transparent' ) {
			return backgroundColor;
		} else if ( baseColors && baseColors?.color?.background ) {
			return baseColors?.color?.background;
		}

		return 'transparent';
	}
}

function fillComputedColors( element, { color, backgroundColor } ) {
	if ( ! color && ! backgroundColor ) {
		return;
	}

	return {
		color: color || getComputedStyleProperty( element, 'color' ),
		backgroundColor: getComputedStyleProperty(
			element,
			'background-color'
		),
	};
}

function TextColorEdit( {
	value,
	onChange,
	isActive,
	activeAttributes,
	contentRef,
} ) {
	const [ allowCustomControl ] = useSettings( 'color.custom' );
	const colors = useMobileGlobalStylesColors();
	const [ isAddingColor, setIsAddingColor ] = useState( false );
	const enableIsAddingColor = useCallback(
		() => setIsAddingColor( true ),
		[ setIsAddingColor ]
	);
	const disableIsAddingColor = useCallback(
		() => setIsAddingColor( false ),
		[ setIsAddingColor ]
	);
	const colorIndicatorStyle = useMemo(
		() =>
			fillComputedColors(
				contentRef,
				getActiveColors( value, name, colors )
			),
		[ value, colors ]
	);

	const hasColorsToChoose = colors.length || ! allowCustomControl;

	const onPressButton = useCallback( () => {
		if ( hasColorsToChoose ) {
			enableIsAddingColor();
		} else {
			onChange( removeFormat( value, name ) );
		}
	}, [ hasColorsToChoose, value ] );

	const outlineStyle = [
		usePreferredColorSchemeStyle(
			styles[ 'components-inline-color__outline' ],
			styles[ 'components-inline-color__outline--dark' ]
		),
		{ borderWidth: StyleSheet.hairlineWidth },
	];

	if ( ! hasColorsToChoose && ! isActive ) {
		return null;
	}

	const isActiveStyle = {
		...colorIndicatorStyle,
		...( ! colorIndicatorStyle?.backgroundColor
			? { backgroundColor: 'transparent' }
			: {} ),
		...styles[ 'components-inline-color--is-active' ],
	};

	const customContainerStyles =
		styles[ 'components-inline-color__button-container' ];

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					{ isActive && (
						<View style={ outlineStyle } pointerEvents="none" />
					) }

					<ToolbarButton
						name="text-color"
						isActive={ isActive }
						icon={
							<Icon
								icon={
									Object.keys( activeAttributes ).length
										? textColorIcon
										: colorIcon
								}
								style={
									colorIndicatorStyle?.color && {
										color: colorIndicatorStyle.color,
									}
								}
							/>
						}
						title={ title }
						extraProps={ {
							isActiveStyle,
							customContainerStyles,
						} }
						// If has no colors to choose but a color is active remove the color onClick
						onClick={ onPressButton }
					/>
				</ToolbarGroup>
			</BlockControls>
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
