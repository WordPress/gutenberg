/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import {
	useBlockProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	RichText,
	getTypographyClassesAndStyles as useTypographyProps,
	useSettings,
} from '@wordpress/block-editor';

export default function Edit( { attributes, setAttributes, context } ) {
	const { title } = attributes;
	const {
		'core/accordion-icon-position': iconPosition,
		'core/accordion-show-icon': showIcon,
		'core/accordion-heading-level': headingLevel,
	} = context;
	const TagName = 'h' + headingLevel;

	// Set icon attributes.
	useEffect( () => {
		if ( iconPosition !== undefined && showIcon !== undefined ) {
			setAttributes( {
				iconPosition,
				showIcon,
			} );
		}
	}, [ iconPosition, showIcon, setAttributes ] );

	const [ fluidTypographySettings, layout ] = useSettings(
		'typography.fluid',
		'layout'
	);
	const typographyProps = useTypographyProps( attributes, {
		typography: {
			fluid: fluidTypographySettings,
		},
		layout: {
			wideSize: layout?.wideSize,
		},
	} );

	const blockProps = useBlockProps();
	const spacingProps = useSpacingProps( attributes );

	return (
		<TagName { ...blockProps }>
			<button
				className="wp-block-accordion-heading__toggle"
				style={ spacingProps.style }
				tabIndex="-1"
			>
				{ showIcon && iconPosition === 'left' && (
					<span
						className="wp-block-accordion-heading__toggle-icon"
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
					className="wp-block-accordion-heading__toggle-title"
					style={ {
						letterSpacing: typographyProps.style.letterSpacing,
						textDecoration: typographyProps.style.textDecoration,
					} }
				/>
				{ showIcon && iconPosition === 'right' && (
					<span
						className="wp-block-accordion-heading__toggle-icon"
						aria-hidden="true"
					>
						+
					</span>
				) }
			</button>
		</TagName>
	);
}
