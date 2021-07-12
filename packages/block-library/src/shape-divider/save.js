/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { SVG } from '@wordpress/primitives';
import { VIEW_BOX_WIDTH, VIEW_BOX_HEIGHT, getShapePath } from './shapes';

export default function shapeDividerSave( { attributes } ) {
	const { flipHorizontal, flipVertical, height, shapes } = attributes;
	const classes = classnames( {
		[ `flip-horizontal` ]: flipHorizontal,
		[ `flip-vertical` ]: flipVertical,
	} );
	const viewBox = `0 0 ${ VIEW_BOX_WIDTH } ${ height || VIEW_BOX_HEIGHT }`;

	return (
		<div { ...useBlockProps.save( { className: classes } ) }>
			<SVG width="100%" viewBox={ viewBox } xmlns="http://www.w3.org/2000/svg">
				{ shapes.map( ( shape, index ) =>
					getShapePath( shape, index, height )
				) }
			</SVG>
		</div>
	);
}
