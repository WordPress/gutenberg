import clsx from 'clsx';
import {
	getColorClassName,
	InspectorControls,
	useBlockProps,
	__experimentalUseColorProps as useColorProps,
} from '@wordpress/block-editor';
import { HorizontalRule } from '@wordpress/components';
import { SelectControl } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import useDeprecatedOpacity from './use-deprecated-opacity';

const HTML_ELEMENT_ITEMS = [
	{ label: __( 'Default (<hr>)' ), value: 'hr' },
	{ label: '<div>', value: 'div' },
];

const HtmlElementControl = ( { tagName = 'hr', setAttributes } ) => {
	const selectedItem =
		HTML_ELEMENT_ITEMS.find( ( item ) => item.value === tagName ) ??
		HTML_ELEMENT_ITEMS[ 0 ];

	return (
		<SelectControl
			label={ __( 'HTML element' ) }
			value={ selectedItem }
			onValueChange={ ( item ) =>
				setAttributes( { tagName: item?.value ?? 'hr' } )
			}
			items={ HTML_ELEMENT_ITEMS }
			description={
				tagName === 'hr'
					? __(
							'Only select <hr> if the separator conveys important information and should be announced by screen readers.'
						)
					: __(
							'The <div> element should only be used if the block is a design element with no semantic meaning.'
						)
			}
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
