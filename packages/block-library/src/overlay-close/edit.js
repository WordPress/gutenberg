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
	__experimentalUseColorProps as useColorProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	TextControl,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';

export default function OverlayCloseEdit( { attributes, setAttributes } ) {
	const { displayMode, text } = attributes;
	const colorProps = useColorProps( attributes );
	const blockProps = useBlockProps( {
		className: 'wp-block-overlay-close',
	} );

	const showIcon = displayMode === 'icon' || displayMode === 'both';
	const showText = displayMode === 'text' || displayMode === 'both';

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
					{ showText && (
						<TextControl
							label={ __( 'Text' ) }
							value={ text }
							onChange={ ( value ) =>
								setAttributes( { text: value } )
							}
							help={ __(
								'Customize the close button text label.'
							) }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<Button
					className={ clsx(
						'wp-block-overlay-close__button',
						colorProps.className
					) }
					style={ colorProps.style }
					icon={ showIcon ? close : undefined }
					text={ showText ? text : undefined }
					aria-label={ __( 'Close' ) }
					__next40pxDefaultSize
				/>
			</div>
		</>
	);
}
