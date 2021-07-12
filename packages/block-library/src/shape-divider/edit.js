/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { ResizableBox } from '@wordpress/components';
import { SVG } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import ShapeDividerControls from './controls';
import {
	VIEW_BOX_WIDTH,
	VIEW_BOX_HEIGHT,
	generatePathValue,
	getShapePath,
} from './shapes';

function ShapeDividerEdit( props ) {
	const { attributes, isSelected, setAttributes, toggleSelection } = props;
	const { flipHorizontal, flipVertical, height, shapes } = attributes;

	const classes = classnames( {
		[ `flip-horizontal` ]: flipHorizontal,
		[ `flip-vertical` ]: flipVertical,
	} );
	const styles = { height: `${ height }px` };
	const blockProps = useBlockProps( { className: classes } );
	const viewBox = `0 0 ${ VIEW_BOX_WIDTH } ${ height || VIEW_BOX_HEIGHT }`;

	// Resizing the divider changes the available height for the inner shapes.
	// Recalculate them when the height changes.
	const handleResize = ( newHeight ) => {
		const updatedShapes = shapes.map( ( shape ) => {
			return {
				...shape,
				path: generatePathValue( shape, newHeight ),
			};
		} );

		setAttributes( {
			height: newHeight,
			shapes: updatedShapes,
		} );
	};

	return (
		<>
			<div { ...blockProps }>
				<ResizableBox
					size={ { height, width: '100%' } }
					minHeight={ 5 }
					maxHeight={ Math.max( VIEW_BOX_HEIGHT, height ) }
					enable={ {
						top: true,
						right: false,
						bottom: true,
						left: false,
						topRight: false,
						bottomRight: false,
						bottomLeft: false,
						topLeft: false,
					} }
					onResize={ ( event, direction, elt ) => {
						handleResize( parseInt( elt.offsetHeight, 10 ) );
						toggleSelection( false );
					} }
					onResizeStop={ ( event, direction, elt, delta ) => {
						handleResize( parseInt( height + delta.height, 10 ) );
						toggleSelection( true );
					} }
					showHandle={ isSelected }
				>
					<SVG
						xmlns="http://www.w3.org/2000/svg"
						viewBox={ viewBox }
						width="100%"
						preserveAspectRatio="none meet"
					>
						{ shapes.map( ( shape, index ) =>
							getShapePath( shape, index, height )
						) }
					</SVG>
				</ResizableBox>
			</div>
			<ShapeDividerControls { ...props } />
		</>
	);
}

export default ShapeDividerEdit;
