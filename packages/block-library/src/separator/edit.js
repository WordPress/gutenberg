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

const MIN_HEIGHT = 1;
const MAX_HEIGHT = 300;

function SeparatorEdit( props ) {
	const {
		attributes: { height },
		setAttributes,
		className,
		color,
		setColor,
		isSelected,
		toggleSelection,
	} = props;

	const margin = height ? `${ height }px` : undefined;

	const onResizeStop = ( event, direction, elt, delta ) => {
		toggleSelection( true );
		setAttributes( {
			height: clamp(
				Math.round( height + delta.height ),
				MIN_HEIGHT,
				MAX_HEIGHT
			),
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
					bottom: true,
					left: false,
				} }
				minHeight={ MIN_HEIGHT }
				onResizeStart={ () => toggleSelection( false ) }
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
							marginBottom: margin,
							marginTop: margin,
						},
					} ) }
				/>
			</ResizableBox>
			<SeparatorSettings color={ color } setColor={ setColor } />
		</>
	);
}

export default withColors( 'color', { textColor: 'color' } )( SeparatorEdit );
