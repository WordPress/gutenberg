/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import clsx from 'clsx';

export default function save( { attributes } ) {
	const { showIcon, iconPosition } = attributes;
	const iconStateClassName = clsx( {
		'has-icon': showIcon,
		'has-icon-left': showIcon && iconPosition === 'left',
		'has-icon-right': showIcon && iconPosition === 'right',
	} );
	const blockProps = useBlockProps.save( {
		role: 'group',
		className: iconStateClassName,
	} );
	return <div { ...useInnerBlocksProps.save( blockProps ) } />;
}
