/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import {
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useBlockProps,
} from '@wordpress/block-editor';

function Burger( { setAttributes } ) {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-burger__inner-container',
		},
		{
			placeholder: <div>Put some spice on your burger</div>,
		}
	);

	setAttributes( { blockId: blockProps.id } );

	return (
		<div { ...blockProps }>
			<div className="wp-block-burger__toggle-button">Toggle Menu</div>
			<div { ...innerBlocksProps } />
		</div>
	);
}

export default Burger;
