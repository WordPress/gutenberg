/**
 * External dependencies
 */
/* eslint-disable import/no-extraneous-dependencies */
import { select } from '@storybook/addon-knobs';
/* eslint-enable import/no-extraneous-dependencies */

export const getCardProps = ( props = {} ) => {
	const { size, variant } = props;

	return {
		size: select(
			'size',
			{
				lg: 'lg',
				md: 'md',
				sm: 'sm',
				xs: 'xs',
			},
			size || 'md'
		),
		variant: select(
			'variant',
			{
				default: 'default',
				borderless: 'borderless',
				raised: 'raised',
			},
			variant || 'default'
		),
	};
};

export const getCardStyleProps = ( props = {} ) => {
	const width = select(
		'Card Width',
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
