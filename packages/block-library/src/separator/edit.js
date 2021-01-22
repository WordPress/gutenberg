/**
 * External dependencies
 */
import classnames from 'classnames';
import { clamp } from 'lodash';

/**
 * WordPress dependencies
 */
import { ResizableBox } from '@wordpress/components';
import { withColors, useBlockProps } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import SeparatorSettings from './separator-settings';

const MIN_HEIGHT = 10;
const MIN_DOTS_HEIGHT = 30;
const MAX_HEIGHT = 500;

function SeparatorEdit( props ) {
	const {
		attributes,
		setAttributes,
		className,
		color,
		setColor,
		isSelected,
	} = props;
	const { height } = attributes;
	const hasDotsStyle = attributes.className?.indexOf( 'is-style-dots' ) >= 0;

	const onResizeStop = ( _event, _direction, elt ) => {
		const newHeight = Math.round( elt.clientHeight );
		setAttributes( { height: clamp( newHeight, MIN_HEIGHT, MAX_HEIGHT ) } );
	};

	const blockProps = useBlockProps( {
		className: classnames( className, {
			'has-background': color.color,
			[ color.class ]: color.class,
		} ),
		style: {
			backgroundColor: color.color,
			color: color.color,
		},
	} );

	return (
		<>
			<div { ...blockProps }>
				<ResizableBox
					className={ classnames(
						'block-library-separator__resize-container',
						{
							'is-selected': isSelected,
						}
					) }
					size={ { height } }
					enable={ {
						top: false,
						right: false,
						bottom: true, // Only enable bottom handle.
						left: false,
						topRight: false,
						bottomRight: false,
						bottomLeft: false,
						topLeft: false,
					} }
					minHeight={ hasDotsStyle ? MIN_DOTS_HEIGHT : MIN_HEIGHT }
					onResizeStop={ onResizeStop }
					showHandle={ isSelected }
				/>
			</div>
			<SeparatorSettings color={ color } setColor={ setColor } />
		</>
	);
}

export default withColors( 'color', { textColor: 'color' } )( SeparatorEdit );
