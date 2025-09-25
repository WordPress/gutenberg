/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import {
	useBlockProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	BlockControls,
	HeadingLevelDropdown,
	RichText,
} from '@wordpress/block-editor';
import { ToolbarGroup } from '@wordpress/components';

export default function Edit( { attributes, setAttributes, context } ) {
	const { level, title, levelOptions } = attributes;
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
	const spacingProps = useSpacingProps( attributes );

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
			<TagName { ...blockProps }>
				<button
					className="wp-block-accordion-header__toggle"
					style={ {
						...spacingProps.style,
					} }
				>
					{ showIcon && iconPosition === 'left' && (
						<span
							className="wp-block-accordion-header__toggle-icon"
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
						className="wp-block-accordion-header__toggle-title"
					/>
					{ showIcon && iconPosition === 'right' && (
						<span
							className="wp-block-accordion-header__toggle-icon"
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
