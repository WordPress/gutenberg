/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import {
	useBlockProps,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalUseColorProps as useColorProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	__experimentalGetShadowClassesAndStyles as useShadowProps,
	BlockControls,
	HeadingLevelDropdown,
	RichText,
} from '@wordpress/block-editor';
import { ToolbarGroup } from '@wordpress/components';
/**
 * Internal dependencies
 */
import { plus } from '../accordion-content/icons';

const ICONS = {
	plus,
};

export default function Edit( { attributes, setAttributes, context } ) {
	const { level, title, textAlign, levelOptions } = attributes;
	const {
		'core/accordion-icon-position': iconPosition,
		'core/accordion-show-icon': showIcon,
	} = context;
	const TagName = 'h' + level;

	// Set icon attributes.
	useEffect( () => {
		if ( iconPosition !== undefined && showIcon !== undefined ) {
			setAttributes( {
				iconPosition,
				showIcon,
			} );
		}
	}, [ iconPosition, showIcon, setAttributes ] );

	const blockProps = useBlockProps();
	const borderProps = useBorderProps( attributes );
	const colorProps = useColorProps( attributes );
	const spacingProps = useSpacingProps( attributes );
	const shadowProps = useShadowProps( attributes );

	const Icon = ICONS.plus;
	const shouldShowIcon = showIcon && Icon;

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<HeadingLevelDropdown
						value={ level }
						options={ levelOptions }
						onChange={ ( newLevel ) =>
							setAttributes( { level: newLevel } )
						}
					/>
				</ToolbarGroup>
			</BlockControls>
			<TagName
				{ ...blockProps }
				className={ clsx(
					blockProps.className,
					colorProps.className,
					borderProps.className,
					'accordion-content__heading',
					{
						[ `has-custom-font-size` ]: blockProps.style.fontSize,
						[ `icon-position-left` ]: iconPosition === 'left',
						[ `has-text-align-${ textAlign }` ]: textAlign,
					}
				) }
				style={ {
					...borderProps.style,
					...colorProps.style,
					...shadowProps.style,
				} }
			>
				<button
					className={ clsx( 'accordion-content__toggle' ) }
					style={ {
						...spacingProps.style,
					} }
				>
					<RichText
						allowedFormats={ [
							'core/bold',
							'core/italic',
							'core/image',
							'core/strikethrough',
						] }
						disableLineBreaks
						tagName="span"
						value={ title }
						onChange={ ( newTitle ) =>
							setAttributes( { title: newTitle } )
						}
						placeholder={ __( 'Accordion title' ) }
					/>
					{ shouldShowIcon && (
						<span
							className={ clsx(
								`accordion-content__toggle-icon`,
								{
									'has-icon-plus': true,
								}
							) }
							style={ {
								// TO-DO: make this configurable
								width: `1.2em`,
								height: `1.2em`,
							} }
						>
							{ Icon && <Icon width="1.2em" height="1.2em" /> }
						</span>
					) }
				</button>
			</TagName>
		</>
	);
}
