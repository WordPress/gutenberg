import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import FontFamilyControl from '..';
import type { FontFamilyControlProps } from '../types';

export default {
	component: FontFamilyControl,
	id: 'blockeditor-fontfamilycontrol',
	title: 'Editor/Block Editor/FontFamilyControl',
} satisfies Meta< typeof FontFamilyControl >;

type Story = StoryObj< typeof FontFamilyControl >;

export const Default: Story = {
	render: function Template( props: Partial< FontFamilyControlProps > ) {
		const [ value, setValue ] = useState< string >();
		return (
			<FontFamilyControl
				onChange={ setValue }
				value={ value }
				{ ...props }
			/>
		);
	},
	args: {
		fontFamilies: [
			{
				fontFace: [
					{
						fontFamily: 'Inter',
						fontStretch: 'normal',
						fontStyle: 'normal',
						fontWeight: '200 900',
						src: [
							'file:./assets/fonts/inter/Inter-VariableFont_slnt,wght.ttf',
						],
					},
				],
				fontFamily: '"Inter", sans-serif',
				name: 'Inter',
				slug: 'inter',
			},
			{
				fontFamily:
					'-apple-system,system-ui,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
				name: 'System Font',
				slug: 'system-font',
			},
		],
	},
};
