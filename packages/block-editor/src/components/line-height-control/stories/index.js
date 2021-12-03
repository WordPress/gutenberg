/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import LineHeightControl from '../';

export default {
	component: LineHeightControl,
	title: 'BlockEditor/LineHeightControl',
};

const Template = ( props ) => {
	const [ value, setValue ] = useState();
	return (
		<>
			<LineHeightControl
				onChange={ setValue }
				value={ value }
				{ ...props }
			/>
			<hr />
			<p>value: { value }</p>
			<p>type: { typeof value }</p>
		</>
	);
};

export const Default = Template.bind( {} );
