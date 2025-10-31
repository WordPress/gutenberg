/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontFamilyControl from '..';

export default {
	component: FontFamilyControl,
	title: 'BlockEditor/FontFamilyControl',
};

export const Default = {
	render: function Template( props ) {
		const [ value, setValue ] = useState();
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
					'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
				name: 'System Font',
				slug: 'system-font',
			},
		],
		__nextHasNoMarginBottom: true,
		__next40pxDefaultSize: true,
	},
};
