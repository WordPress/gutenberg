/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

export default function save( props ) {
	const {
		attributes: {
			iconBackgroundColorValue,
			iconColorValue,
			showLabels,
			size,
		},
	} = props;

	const className = clsx( size, {
		'has-visible-labels': showLabels,
		'has-icon-color': iconColorValue,
		'has-icon-background-color': iconBackgroundColorValue,
	} );
	const blockProps = useBlockProps.save( { className } );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <ul { ...innerBlocksProps } />;
}
