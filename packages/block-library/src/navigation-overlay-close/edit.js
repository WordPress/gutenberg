/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	useBlockProps,
	RichText,
	__experimentalUseColorProps as useColorProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	getTypographyClassesAndStyles as useTypographyProps,
	useSettings,
} from '@wordpress/block-editor';
import {
	PanelBody,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { close as closeIcon } from '@wordpress/icons';

export default function NavigationOverlayCloseEdit( {
	attributes,
	setAttributes,
} ) {
	const { displayMode, text } = attributes;
	const colorProps = useColorProps( attributes );
	const spacingProps = useSpacingProps( attributes );
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
	const showIcon = displayMode === 'icon' || displayMode === 'both';
	const showText = displayMode === 'text' || displayMode === 'both';

	const blockProps = useBlockProps( {
		className: clsx(
			'wp-block-navigation-overlay-close',
			colorProps.className,
			spacingProps.className,
			typographyProps.className
		),
		style: {
			...colorProps.style,
			...spacingProps.style,
			...typographyProps.style,
		},
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Display Settings' ) }>
					<ToggleGroupControl
						label={ __( 'Display Mode' ) }
						value={ displayMode }
						onChange={ ( value ) =>
							setAttributes( { displayMode: value } )
						}
						isBlock
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					>
						<ToggleGroupControlOption
							value="icon"
							label={ __( 'Icon' ) }
						/>
						<ToggleGroupControlOption
							value="text"
							label={ __( 'Text' ) }
						/>
						<ToggleGroupControlOption
							value="both"
							label={ __( 'Both' ) }
						/>
					</ToggleGroupControl>
				</PanelBody>
			</InspectorControls>
			<Button
				{ ...blockProps }
				icon={ showIcon ? closeIcon : undefined }
				aria-label={ __( 'Close' ) }
				__next40pxDefaultSize
			>
				{ showText && (
					<RichText
						identifier="text"
						value={ text }
						onChange={ ( value ) =>
							setAttributes( { text: value } )
						}
						placeholder={ __( 'Close' ) }
						allowedFormats={ [ 'core/bold', 'core/italic' ] }
						withoutInteractiveFormatting
						tagName="span"
						className="wp-block-navigation-overlay-close__text"
					/>
				) }
			</Button>
		</>
	);
}
