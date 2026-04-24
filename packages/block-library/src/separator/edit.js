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
import { HorizontalRule, SelectControl } from '@wordpress/components';
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
			onChange={ ( newValue ) => setAttributes( { tagName: newValue } ) }
			options={ [
				{ label: __( 'Default (<hr>)' ), value: 'hr' },
				{ label: '<div>', value: 'div' },
			] }
			help={
				tagName === 'hr'
					? __(
							'Only select <hr> if the separator conveys important information and should be announced by screen readers.'
					  )
					: __(
							'The <div> element should only be used if the block is a design element with no semantic meaning.'
					  )
			}
			__next40pxDefaultSize
		/>
	);
};

export default function SeparatorEdit( { attributes, setAttributes } ) {
	const { backgroundColor, opacity, style, tagName } = attributes;
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
