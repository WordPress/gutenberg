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
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import getIconContent from './get-icon-content';

export default function Edit( { attributes, setAttributes, context } ) {
	const { title } = attributes;
	const {
		'core/accordion-icon-position': iconPosition,
		'core/accordion-icon-type': iconType,
		'core/accordion-show-icon': showIcon,
		'core/accordion-heading-level': headingLevel,
	} = context;
	const TagName = 'h' + headingLevel;
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	// Set icon attributes.
	useEffect( () => {
		if ( iconPosition !== undefined && showIcon !== undefined ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				iconPosition,
				showIcon,
				iconType: iconType || 'plus',
			} );
		}
	}, [
		iconPosition,
		iconType,
		showIcon,
		setAttributes,
		__unstableMarkNextChangeAsNotPersistent,
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

	const iconContent = getIconContent( iconType );

	return (
		<TagName { ...blockProps }>
			<button
				className="wp-block-accordion-heading__toggle"
				style={ spacingProps.style }
				tabIndex="-1"
			>
				{ showIcon && iconPosition === 'left' && (
					<span
						className={ `wp-block-accordion-heading__toggle-icon is-icon-${
							iconType || 'plus'
						}` }
						aria-hidden="true"
					>
						{ iconContent }
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
						className={ `wp-block-accordion-heading__toggle-icon is-icon-${
							iconType || 'plus'
						}` }
						aria-hidden="true"
					>
						{ iconContent }
					</span>
				) }
			</button>
		</TagName>
	);
}
