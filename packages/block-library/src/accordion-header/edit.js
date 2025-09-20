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
					{ showIcon && iconPosition === 'left' && (
						<span
							className="accordion-content__toggle-icon"
							aria-hidden="true"
						>
							+
						</span>
					) }
					<RichText
						withoutInteractiveFormatting
						disableLineBreaks
						tagName="span"
						value={ title }
						onChange={ ( newTitle ) =>
							setAttributes( { title: newTitle } )
						}
						placeholder={ __( 'Accordion title' ) }
					/>
					{ showIcon && iconPosition === 'right' && (
						<span
							className="accordion-content__toggle-icon"
							aria-hidden="true"
						>
							+
						</span>
					) }
				</button>
			</TagName>
		</>
	);
}
