/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

export default function save( props ) {
	const {
		attributes: { iconBackgroundColorValue, iconColorValue, size },
	} = props;

	const className = classNames( size, {
		'has-icon-color': iconColorValue,
		'has-icon-background-color': iconBackgroundColorValue,
	} );
	const blockProps = useBlockProps.save( { className } );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <ul { ...innerBlocksProps } />;
}
