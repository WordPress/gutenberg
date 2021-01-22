/**
 * External dependencies
 */
import classnames from 'classnames';
import { clamp } from 'lodash';

/**
 * WordPress dependencies
 */
import { HorizontalRule, ResizableBox } from '@wordpress/components';
import { withColors, useBlockProps } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import SeparatorSettings from './separator-settings';

const MIN_HEIGHT = 5;
const MAX_HEIGHT = 500;

function SeparatorEdit( props ) {
	const {
		attributes: { height },
		setAttributes,
		className,
		color,
		setColor,
		isSelected,
	} = props;

	const onResizeStop = ( _event, _direction, elt ) => {
		setAttributes( {
			height: clamp( elt.clientHeight, MIN_HEIGHT, MAX_HEIGHT ),
		} );
	};

	return (
		<>
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
				minHeight={ MIN_HEIGHT }
				onResizeStop={ onResizeStop }
				showHandle={ isSelected }
			>
				<HorizontalRule
					{ ...useBlockProps( {
						className: classnames( className, {
							'has-background': color.color,
							[ color.class ]: color.class,
						} ),
						style: {
							backgroundColor: color.color,
							color: color.color,
						},
					} ) }
				/>
			</ResizableBox>
			<SeparatorSettings color={ color } setColor={ setColor } />
		</>
	);
}

export default withColors( 'color', { textColor: 'color' } )( SeparatorEdit );
