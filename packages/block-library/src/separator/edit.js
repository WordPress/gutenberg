/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { HorizontalRule, ResizableBox } from '@wordpress/components';
import { withColors } from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SeparatorSettings from './separator-settings';

function SeparatorEdit( {
	attributes,
	isSelected,
	setAttributes,
	onResizeStart,
	onResizeStop,
	color,
	setColor,
	className,
} ) {
	const { height } = attributes;
	const [ inputHeightValue, setInputHeightValue ] = useState( height );

	return (
		<>
			<ResizableBox
				className={ classnames(
					'block-library-separator__resize-container',
					{
						'is-selected': isSelected,
					}
				) }
				size={ {
					height,
				} }
				minHeight="20"
				enable={ {
					top: false,
					right: false,
					bottom: true,
					left: false,
					topRight: false,
					bottomRight: false,
					bottomLeft: false,
					topLeft: false,
				} }
				onResizeStart={ onResizeStart }
				onResizeStop={ ( event, direction, elt, delta ) => {
					onResizeStop();
					const separatorHeight = parseInt(
						height + delta.height,
						10
					);
					setAttributes( {
						height: separatorHeight,
					} );
					setInputHeightValue( separatorHeight );
				} }
			>
				<HorizontalRule
					className={ classnames( className, {
						'has-background': color.color,
						[ color.class ]: color.class,
					} ) }
					style={ {
						backgroundColor: color.color,
						color: color.color,
					} }
				/>
			</ResizableBox>
			<SeparatorSettings
				color={ color }
				height={ inputHeightValue }
				setColor={ setColor }
				setInputHeightValue={ setInputHeightValue }
				setAttributes={ setAttributes }
			/>
		</>
	);
}

export default compose( [
	withColors( 'color', { textColor: 'color' } ),
	withDispatch( ( dispatch ) => {
		const { toggleSelection } = dispatch( 'core/block-editor' );

		return {
			onResizeStart: () => toggleSelection( false ),
			onResizeStop: () => toggleSelection( true ),
		};
	} ),
] )( SeparatorEdit );
