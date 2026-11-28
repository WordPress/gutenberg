import type { ComponentProps } from 'react';
import type { Meta } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import HeightControl from '../';

export default {
	component: HeightControl,
	id: 'blockeditor-heightcontrol',
	title: 'Editor/Block Editor/HeightControl',
} satisfies Meta< typeof HeightControl >;

const Template = (
	props: Partial< ComponentProps< typeof HeightControl > >
) => {
	const [ value, setValue ] = useState< string >();
	return <HeightControl onChange={ setValue } value={ value } { ...props } />;
};

export const Default = Template.bind( {} );
