/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ControlGroup from '../index';
import NumberControl from '../../number-control';
import { FlexBlock } from '../../flex';
import Text from '../../text';

export default {
	title: 'Components/ControlGroup',
	component: ControlGroup,
};

const Label = ( props ) => (
	<Text
		{ ...props }
		variant="caption"
		style={ {
			display: 'block',
			textAlign: 'center',
			opacity: 0.4,
			paddingTop: 4,
		} }
	/>
);

const Example = () => {
	const [ r, setR ] = useState( 0 );
	const [ g, setG ] = useState( 0 );
	const [ b, setB ] = useState( 0 );
	const [ a, setA ] = useState( 1 );

	return (
		<ControlGroup style={ { maxWidth: 240 } }>
			<FlexBlock>
				<NumberControl
					autoComplete="off"
					placeholder="0"
					min="0"
					max="255"
					value={ r }
					hideHTMLArrows
					onChange={ ( n ) => setR( n ) }
				/>
				<Label>R</Label>
			</FlexBlock>
			<FlexBlock>
				<NumberControl
					autoComplete="off"
					placeholder="0"
					min="0"
					max="255"
					value={ g }
					hideHTMLArrows
					onChange={ ( n ) => setG( n ) }
				/>
				<Label>G</Label>
			</FlexBlock>
			<FlexBlock>
				<NumberControl
					autoComplete="off"
					placeholder="0"
					min="0"
					max="255"
					value={ b }
					hideHTMLArrows
					onChange={ ( n ) => setB( n ) }
				/>
				<Label>B</Label>
			</FlexBlock>
			<FlexBlock>
				<NumberControl
					autoComplete="off"
					placeholder="1"
					min="0"
					max="1"
					step="0.01"
					value={ a }
					hideHTMLArrows
					onChange={ ( n ) => setA( n ) }
				/>
				<Label>A</Label>
			</FlexBlock>
		</ControlGroup>
	);
};

export const _default = () => {
	return (
		<div style={ { padding: 20 } }>
			<Example />
		</div>
	);
};
