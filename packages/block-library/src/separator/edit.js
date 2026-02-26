/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	InspectorControls,
	useBlockProps,
	__experimentalUseColorProps as useColorProps,
} from '@wordpress/block-editor';
import {
	HorizontalRule,
	SelectControl,
	ToggleControl,
	Notice,
	PanelBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useDeprecatedOpacity from './use-deprecated-opacity';

const HtmlElementControl = ( { tagName, setAttributes } ) => {
	return (
		<SelectControl
			label={ __( 'HTML element' ) }
			value={ tagName }
			onChange={ ( newValue ) => {
				setAttributes( { tagName: newValue } );
				// When switching to div, ensure it's decorative.
				if ( newValue === 'div' ) {
					setAttributes( { isDecorative: true } );
				}
			} }
			options={ [
				{ label: __( 'Default (<hr>)' ), value: 'hr' },
				{ label: '<div>', value: 'div' },
			] }
			help={ __( 'Change only if needed for custom CSS targeting.' ) }
			__next40pxDefaultSize
		/>
	);
};

export default function SeparatorEdit( { attributes, setAttributes } ) {
	const {
		backgroundColor,
		opacity,
		style,
		tagName,
		isDecorative = true,
	} = attributes;
	const colorProps = useColorProps( attributes );
	const currentColor = colorProps?.style?.backgroundColor;
	const hasCustomColor = !! style?.color?.background;

	useDeprecatedOpacity( opacity, currentColor, setAttributes );

	// The dots styles uses text for the dots, to change those dots color is
	// using color, not backgroundColor.
	const colorClass = getColorClassName( 'color', backgroundColor );

	const className = clsx(
		{
			'has-text-color': backgroundColor || currentColor,
			[ colorClass ]: colorClass,
			'has-css-opacity': opacity === 'css',
			'has-alpha-channel-opacity': opacity === 'alpha-channel',
		},
		colorProps.className
	);

	const styles = {
		color: currentColor,
		backgroundColor: currentColor,
	};
	const Wrapper = tagName === 'hr' ? HorizontalRule : tagName;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					{ tagName === 'hr' && (
						<ToggleControl
							label={ __( 'Decorative separator' ) }
							checked={ isDecorative }
							onChange={ ( value ) =>
								setAttributes( { isDecorative: value } )
							}
							help={
								isDecorative
									? __(
											'This separator is hidden from assistive technologies.'
									  )
									: __(
											'This separator announces a thematic break to screen readers.'
									  )
							}
						/>
					) }

					{ tagName === 'div' && (
						<Notice status="info" isDismissible={ false }>
							{ __(
								'Non-HR elements are automatically decorative.'
							) }
						</Notice>
					) }
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="advanced">
				<HtmlElementControl
					tagName={ tagName }
					setAttributes={ setAttributes }
				/>
			</InspectorControls>
			<Wrapper
				{ ...useBlockProps( {
					className,
					style: hasCustomColor ? styles : undefined,
				} ) }
			/>
		</>
	);
}
