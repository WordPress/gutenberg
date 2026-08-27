import clsx from 'clsx';
import {
	useBlockProps,
	useInnerBlocksProps,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { hasFixedLayout } = attributes;

	const colorProps = getColorClassesAndStyles( attributes );
	const borderProps = getBorderClassesAndStyles( attributes );

	const blockProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save( {
		className: clsx( colorProps.className, borderProps.className, {
			'has-fixed-layout': hasFixedLayout,
		} ),
		style: { ...colorProps.style, ...borderProps.style },
	} );

	return (
		<figure { ...blockProps }>
			<table { ...innerBlocksProps } />
		</figure>
	);
}
