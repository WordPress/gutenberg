/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import LineHeightControl, { LegacyLineHeightControl } from '../';

export default {
	component: LineHeightControl,
	title: 'BlockEditor/LineHeightControl',
};

const Template = ( props ) => {
	const [ value, setValue ] = useState();
	return (
		<LineHeightControl onChange={ setValue } value={ value } { ...props } />
	);
};

export const Default = Template.bind( {} );
Default.args = {
	__nextHasNoMarginBottom: true,
	__unstableInputWidth: '60px',
};

export const UnconstrainedWidth = Template.bind( {} );
UnconstrainedWidth.args = {
	...Default.args,
	__unstableInputWidth: '100%',
};

// TODO: Remove before merge
export const TemporaryTest = () => {
	const [ value, setValue ] = useState();
	return (
		<div
			style={ {
				display: 'grid',
				gap: 20,
				gridTemplateColumns: '1fr 1fr',
				width: 300,
			} }
		>
			<div>
				<h2>Migrated</h2>
				<Template />
			</div>
			<div>
				<h2>Legacy</h2>
				<LegacyLineHeightControl
					onChange={ setValue }
					value={ value }
				/>
				<hr />
				<p>value: { value }</p>
				<p>type: { typeof value }</p>
			</div>
		</div>
	);
};
