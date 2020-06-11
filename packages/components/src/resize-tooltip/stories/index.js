/**
 * External dependencies
 */
import { boolean, number, select, text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ResizableBox from '../../resizable-box';
import ResizeTooltip from '../';

export default {
	title: 'Components/ResizeTooltip',
	component: ResizeTooltip,
};

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
	const props = {
		fadeTimeout: number( 'fadeTimeout', 180 ),
		position: select(
			'position',
			{ bottom: 'bottom', cursor: 'cursor', corner: 'corner' },
			'cursor'
		),
		showPx: boolean( 'showPx', true ),
	};

	const content = text( 'Example: Content', 'Resize' );

	return (
		<Example>
			<ResizeTooltip { ...props } />
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
