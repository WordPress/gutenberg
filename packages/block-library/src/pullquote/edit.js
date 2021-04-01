/**
 * External dependencies
 */
import classnames from 'classnames';
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Platform, useEffect, useRef } from '@wordpress/element';
import {
	RichText,
	ContrastChecker,
	InspectorControls,
	withColors,
	PanelColorSettings,
	useBlockProps,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Figure } from './figure';
import { BlockQuote } from './blockquote';

/**
 * Internal dependencies
 */
import { SOLID_COLOR_CLASS } from './shared';

function PullQuoteEdit( {
	colorUtils,
	textColor,
	attributes: { value, citation },
	setAttributes,
	setTextColor,
	setMainColor,
	mainColor,
	isSelected,
	insertBlocksAfter,
} ) {
	const wasTextColorAutomaticallyComputed = useRef( false );
	const blockProps = useBlockProps();
	const { style = {}, className } = blockProps;
	const isSolidColorStyle = includes( className, SOLID_COLOR_CLASS );
	const newBlockProps = {
		...blockProps,
		className: classnames( className, {
			'has-background': isSolidColorStyle && mainColor.color,
			[ mainColor.class ]: isSolidColorStyle && mainColor.class,
		} ),
		style: isSolidColorStyle
			? { ...style, backgroundColor: mainColor.color }
			: { ...style, borderColor: mainColor.color },
	};

	function pullQuoteMainColorSetter( colorValue ) {
		const needTextColor =
			! textColor.color || wasTextColorAutomaticallyComputed.current;
		const shouldSetTextColor = isSolidColorStyle && needTextColor;

		if ( isSolidColorStyle ) {
			// If we use the solid color style, set the color using the normal mechanism.
			setMainColor( colorValue );
		} else {
			// If we use the default style, set the color as a custom color to force the usage of an inline style.
			// Default style uses a border color for which classes are not available.
			setAttributes( { customMainColor: colorValue } );
		}

		if ( shouldSetTextColor ) {
			if ( colorValue ) {
				wasTextColorAutomaticallyComputed.current = true;
				setTextColor( colorUtils.getMostReadableColor( colorValue ) );
			} else if ( wasTextColorAutomaticallyComputed.current ) {
				// We have to unset our previously computed text color on unsetting the main color.
				wasTextColorAutomaticallyComputed.current = false;
				setTextColor();
			}
		}
	}

	function pullQuoteTextColorSetter( colorValue ) {
		setTextColor( colorValue );
		wasTextColorAutomaticallyComputed.current = false;
	}

	useEffect( () => {
		// If the block includes a named color and we switched from the
		// solid color style to the default style.
		if ( mainColor && ! isSolidColorStyle ) {
			// Remove the named color, and set the color as a custom color.
			// This is done because named colors use classes, in the default style we use a border color,
			// and themes don't set classes for border colors.
			setAttributes( {
				mainColor: undefined,
				customMainColor: mainColor.color,
			} );
		}
	}, [ isSolidColorStyle, mainColor ] );

	return (
		<>
			<Figure { ...newBlockProps }>
				<BlockQuote
					style={ {
						color: textColor.color,
					} }
					className={
						textColor.color &&
						classnames( 'has-text-color', {
							[ textColor.class ]: textColor.class,
						} )
					}
				>
					<RichText
						identifier="value"
						multiline
						value={ value }
						onChange={ ( nextValue ) =>
							setAttributes( {
								value: nextValue,
							} )
						}
						aria-label={ __( 'Pullquote text' ) }
						placeholder={
							// translators: placeholder text used for the quote
							__( 'Add quote' )
						}
						textAlign="center"
					/>
					{ ( ! RichText.isEmpty( citation ) || isSelected ) && (
						<RichText
							identifier="citation"
							value={ citation }
							aria-label={ __( 'Pullquote citation text' ) }
							placeholder={
								// translators: placeholder text used for the citation
								__( 'Add citation' )
							}
							onChange={ ( nextCitation ) =>
								setAttributes( {
									citation: nextCitation,
								} )
							}
							className="wp-block-pullquote__citation"
							__unstableMobileNoFocusOnMount
							textAlign="center"
							__unstableOnSplitAtEnd={ () =>
								insertBlocksAfter(
									createBlock( 'core/paragraph' )
								)
							}
						/>
					) }
				</BlockQuote>
			</Figure>
			{ Platform.OS === 'web' && (
				<InspectorControls>
					<PanelColorSettings
						title={ __( 'Color settings' ) }
						colorSettings={ [
							{
								value: mainColor.color,
								onChange: pullQuoteMainColorSetter,
								label: __( 'Main color' ),
							},
							{
								value: textColor.color,
								onChange: pullQuoteTextColorSetter,
								label: __( 'Text color' ),
							},
						] }
					>
						{ isSolidColorStyle && (
							<ContrastChecker
								{ ...{
									textColor: textColor.color,
									backgroundColor: mainColor.color,
								} }
								isLargeText={ false }
							/>
						) }
					</PanelColorSettings>
				</InspectorControls>
			) }
		</>
	);
}

export default withColors( {
	mainColor: 'background-color',
	textColor: 'color',
} )( PullQuoteEdit );
