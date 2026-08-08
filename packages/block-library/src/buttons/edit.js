import clsx from 'clsx';
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

const DEFAULT_BLOCK = {
	name: 'core/button',
};

/*
 * Renders the edit component for the Buttons block in the block editor.
 *
 * @param {Object} props                       Component properties.
 * @param {Object} props.attributes            Block attributes.
 * @param {string} props.attributes.fontSize   The custom font size for the block.
 * @param {Object} props.attributes.layout     The layout configuration for the block.
 * @param {Object} props.attributes.style      The style object, including typography and other styles.
 * @param {string} props.className             Additional class names to apply to the block.
 *
 * @returns {JSX.Element} The Buttons block edit component.
 */
function ButtonsEdit( { attributes, className } ) {
	const { fontSize, layout, style } = attributes;
	const blockProps = useBlockProps( {
		className: clsx( className, {
			'has-custom-font-size': fontSize || style?.typography?.fontSize,
		} ),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		defaultBlock: DEFAULT_BLOCK,
		orientation: layout?.orientation ?? 'horizontal',
	} );

	return <div { ...innerBlocksProps } />;
}

export default ButtonsEdit;
