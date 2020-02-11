/**
 * External dependencies
 */
/* eslint-disable import/no-extraneous-dependencies */
import { boolean, select } from '@storybook/addon-knobs';
/* eslint-enable import/no-extraneous-dependencies */

export const getCardProps = ( props = {} ) => {
	const { size } = props;

	return {
		isBorderless: boolean( 'Card: isBorderless', false ),
		isElevated: boolean( 'Card: isElevated', false ),
		size: select(
			'Card: size',
			{
				large: 'large',
				medium: 'medium',
				small: 'small',
				extraSmall: 'extraSmall',
			},
			size || 'medium'
		),
	};
};

export const getCardStyleProps = ( props = {} ) => {
	const width = select(
		'Example: Width',
		{
			'640px': 640,
			'360px': 360,
			'240px': 240,
			'50%': '50%',
			'100%': '100%',
		},
		props.width || '360px'
	);

	return {
		style: {
			width,
		},
	};
};

export const getCardStoryProps = () => {
	return {
		...getCardStyleProps(),
		...getCardProps(),
	};
};
