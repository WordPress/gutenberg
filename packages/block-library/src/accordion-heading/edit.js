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
		'core/accordion-expand-icon-url': expandIconUrl,
		'core/accordion-collapse-icon-url': collapseIconUrl,
	} = context;
	const TagName = 'h' + headingLevel;

	// Set icon attributes.
	useEffect( () => {
		const newAttrs = {};
		if ( iconPosition !== undefined ) {
			newAttrs.iconPosition = iconPosition;
		}
		if ( showIcon !== undefined ) {
			newAttrs.showIcon = showIcon;
		}
		if ( expandIconUrl !== attributes.expandIconUrl ) {
			newAttrs.expandIconUrl = expandIconUrl;
		}
		if ( collapseIconUrl !== attributes.collapseIconUrl ) {
			newAttrs.collapseIconUrl = collapseIconUrl;
		}

		if ( Object.keys( newAttrs ).length > 0 ) {
			setAttributes( newAttrs );
		}
	}, [
		iconPosition,
		showIcon,
		expandIconUrl,
		collapseIconUrl,
		attributes.expandIconUrl,
		attributes.collapseIconUrl,
		setAttributes,
	] );

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

	const renderIcon = () => (
		<span
			className="wp-block-accordion-heading__toggle-icon"
			aria-hidden="true"
		>
			{ expandIconUrl && collapseIconUrl ? (
				<img
					src={ expandIconUrl }
					alt={ __( 'Expand icon' ) }
					className="wp-block-accordion-heading__icon-expand"
				/>
			) : (
				<span className="wp-block-accordion-heading__icon-expand">
					+
				</span>
			) }
		</span>
	);

	return (
		<TagName { ...blockProps }>
			<button
				className="wp-block-accordion-heading__toggle"
				style={ spacingProps.style }
				tabIndex="-1"
			>
				{ showIcon && iconPosition === 'left' && renderIcon() }
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
				{ showIcon && iconPosition === 'right' && renderIcon() }
			</button>
		</TagName>
	);
}
