/**
 * External dependencies
 */
import { boolean, number, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import ResizableBox from '../';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

export default { title: 'Components/ResizableBox', component: ResizableBox };

const Example = ( props ) => {
	const [ attributes, setAttributes ] = useState( {
		height: 200,
		width: 400,
	} );
	const { height, width } = attributes;
	const { children, ...restProps } = props;

	return (
		<div style={ { margin: 30 } }>
			<ResizableBox
				{ ...restProps }
				size={ {
					height,
					width,
				} }
				onResizeStop={ ( event, direction, elt, delta ) => {
					setAttributes( {
						height: parseInt( height + delta.height, 10 ),
						width: parseInt( width + delta.width, 10 ),
					} );
				} }
			>
				{ children }
			</ResizableBox>
		</div>
	);
};

export const _default = () => {
	const content = text( 'Example: Content', 'Resize' );
	const showHandle = boolean( 'showHandle', true );
	const minHeight = number( 'minHeight', 50 );
	const minWidth = number( 'minWidth', 50 );
	const enable = {
		top: boolean( 'enable.top', false ),
		right: boolean( 'enable.right', true ),
		bottom: boolean( 'enable.bottom', true ),
		left: boolean( 'enable.left', false ),
		topRight: boolean( 'enable.topRight', false ),
		bottomRight: boolean( 'enable.bottomRight', true ),
		bottomLeft: boolean( 'enable.bottomLeft', false ),
		topLeft: boolean( 'enable.topLeft', false ),
	};

	const props = {
		enable,
		minHeight,
		minWidth,
		showHandle,
	};

	return (
		<Example { ...props }>
			<div
				style={ {
					background: '#eee',
					display: 'flex',
					height: '100%',
					width: '100%',
					alignItems: 'center',
					justifyContent: 'center',
				} }
			>
				<span>{ content }</span>
			</div>
		</Example>
	);
};
