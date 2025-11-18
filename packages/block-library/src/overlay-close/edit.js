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
	Button,
	PanelBody,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { close } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function OverlayCloseEdit( { attributes, setAttributes } ) {
	const { displayMode = 'icon' } = attributes;
	const colorProps = useColorProps( attributes );
	const blockProps = useBlockProps( {
		className: 'wp-block-overlay-close',
		style: {
			...colorProps.style,
		},
	} );

	const showIcon = displayMode === 'icon' || displayMode === 'both';
	const showText = displayMode === 'text' || displayMode === 'both';

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Display' ) }>
					<ToggleGroupControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Display mode' ) }
						value={ displayMode }
						onChange={ ( value ) =>
							setAttributes( { displayMode: value } )
						}
						isBlock
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
			<div { ...blockProps }>
				<Button
					__next40pxDefaultSize
					icon={ showIcon ? close : undefined }
					label={ __( 'Close overlay' ) }
					className={ clsx(
						'wp-block-overlay-close__button',
						colorProps.className
					) }
					style={ colorProps.style }
				>
					{ showText ? __( 'Close' ) : null }
				</Button>
			</div>
		</>
	);
}
