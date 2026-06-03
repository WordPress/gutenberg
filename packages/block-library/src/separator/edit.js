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
	PanelBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useDeprecatedOpacity from './use-deprecated-opacity';

function getHelpText( disabled, tagName ) {
	if ( disabled ) {
		return __(
			'Vertical separators always use <div> for correct rendering.'
		);
	}

	const helpText = {
		hr: __(
			'Only select <hr> if the separator conveys important information and should be announced by screen readers.'
		),
		div: __(
			'The <div> element should only be used if the block is a design element with no semantic meaning.'
		),
	};

	return helpText[ tagName ];
}

const HtmlElementControl = ( { tagName, setAttributes, disabled } ) => {
	return (
		<SelectControl
			label={ __( 'HTML element' ) }
			value={ tagName }
			disabled={ disabled }
			help={ getHelpText( disabled, tagName ) }
			onChange={ ( newValue ) => setAttributes( { tagName: newValue } ) }
			options={ [
				{ label: __( 'Default (<hr>)' ), value: 'hr' },
				{ label: '<div>', value: 'div' },
			] }
			__next40pxDefaultSize
		/>
	);
};

export default function SeparatorEdit( { attributes, setAttributes } ) {
	const { backgroundColor, opacity, style, tagName, orientation } =
		attributes;
	const colorProps = useColorProps( attributes );
	const currentColor = colorProps?.style?.backgroundColor;
	const hasCustomColor = !! style?.color?.background;
	const isVertical = orientation === 'vertical';

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
			'is-vertical': isVertical,
		},
		colorProps.className
	);

	const styles = {
		color: currentColor,
		backgroundColor: currentColor,
	};

	let Wrapper = tagName;
	if ( tagName === 'hr' ) {
		Wrapper = HorizontalRule;
	}

	let toggleHelp;
	if ( isVertical ) {
		toggleHelp = __( 'Set vertical orientation for the separator.' );
	}

	const ariaProps = {};
	if ( tagName === 'hr' ) {
		let ariaOrientation = 'horizontal';
		if ( isVertical ) {
			ariaOrientation = 'vertical';
		}
		ariaProps[ 'aria-orientation' ] = ariaOrientation;
	}

	return (
		<>
			<InspectorControls group="advanced">
				<HtmlElementControl
					tagName={ tagName }
					setAttributes={ setAttributes }
					disabled={ isVertical }
				/>
			</InspectorControls>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Vertical' ) }
						checked={ isVertical }
						onChange={ () => {
							let newOrientation = 'vertical';
							if ( isVertical ) {
								newOrientation = 'horizontal';
							}
							const newAttributes = {
								orientation: newOrientation,
							};
							if (
								newOrientation === 'vertical' &&
								tagName === 'hr'
							) {
								newAttributes.tagName = 'div';
							}
							setAttributes( newAttributes );
						} }
						help={ toggleHelp }
					/>
				</PanelBody>
			</InspectorControls>
			<Wrapper
				{ ...useBlockProps( {
					className,
					style: hasCustomColor ? styles : undefined,
					...ariaProps,
				} ) }
			/>
		</>
	);
}
