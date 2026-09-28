import { expect } from 'storybook/test';
import { logged } from '@wordpress/deprecated';
import { useState } from '@wordpress/element';
import HeightControl from '../';

export default {
	component: HeightControl,
	id: 'blockeditor-heightcontrol',
	title: 'Editor/Block Editor/HeightControl',
	play: () => {
		expect(
			logged[
				'wp.blockEditor.HeightControl is deprecated since version 7.0 and will be removed in version 7.2. Please use wp.blockEditor.DimensionControl instead.'
			]
		).toBe( true );
	},
};

const Template = ( props ) => {
	const [ value, setValue ] = useState();
	return <HeightControl onChange={ setValue } value={ value } { ...props } />;
};

export const Default = Template.bind( {} );
