/**
 * External dependencies
 */
import { boolean, select, number } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import {
	Card,
	CardHeader,
	CardBody,
	CardDivider,
	CardMedia,
	CardFooter,
} from '../index';
import { Text } from '../../text';
import { Heading } from '../../heading';
import Button from '../../button';

export default {
	component: Card,
	title: 'Components/Card',
	parameters: {
		knobs: { disable: false },
	},
};

const KNOBS_GROUPS = {
	Card: 'Card',
	CardBody: 'CardBody',
	CardHeader: 'CardHeader',
	CardFooter: 'CardFooter',
};

// Using `unset` instead of `undefined` as Storybook seems to sometimes pass an
// empty string instead of `undefined`, which is not ideal.
// https://github.com/storybookjs/storybook/issues/800
const PROP_UNSET = 'unset';

export const _default = () => {
	const cardProps = {
		isBorderless: boolean( 'Card: isBorderless', false, KNOBS_GROUPS.Card ),
		isRounded: boolean( 'Card: isRounded', true, KNOBS_GROUPS.Card ),
		elevation: number( 'Card: elevation', 0, {}, KNOBS_GROUPS.Card ),
		size: select(
			'Card: size',
			{
				large: 'large',
				medium: 'medium',
				small: 'small',
				xSmall: 'xSmall',
			},
			'medium',
			KNOBS_GROUPS.Card
		),
		style: {
			width: select(
				'Card: width (via inline styles)',
				{
					'640px': 640,
					'360px': 360,
					'240px': 240,
					'50%': '50%',
					'100%': '100%',
				},
				360,
				KNOBS_GROUPS.Card
			),
		},
	};

	const cardHeaderProps = {
		isBorderless: select(
			'CardHeader: isBorderless',
			{
				'unset (defaults to the value set on the <Card> parent)': PROP_UNSET,
				true: true,
				false: false,
			},
			PROP_UNSET,
			KNOBS_GROUPS.CardHeader
		),
		isShady: boolean(
			'CardHeader: isShady',
			false,
			KNOBS_GROUPS.CardHeader
		),
		size: select(
			'CardHeader: size',
			{
				'unset (defaults to the value set on the <Card> parent)': PROP_UNSET,
				large: 'large',
				medium: 'medium',
				small: 'small',
				xSmall: 'xSmall',
			},
			PROP_UNSET,
			KNOBS_GROUPS.CardHeader
		),
	};

	const cardBodyProps = {
		isShady: boolean( 'CardBody: isShady', false, KNOBS_GROUPS.CardBody ),
		size: select(
			'CardBody: size',
			{
				'unset (defaults to the value set on the <Card> parent)': PROP_UNSET,
				large: 'large',
				medium: 'medium',
				small: 'small',
				xSmall: 'xSmall',
			},
			PROP_UNSET,
			KNOBS_GROUPS.CardBody
		),
	};

	const cardFooterProps = {
		isBorderless: select(
			'CardFooter: isBorderless',
			{
				'unset (defaults to the value set on the <Card> parent)': PROP_UNSET,
				true: true,
				false: false,
			},
			PROP_UNSET,
			KNOBS_GROUPS.CardFooter
		),
		isShady: boolean(
			'CardFooter: isShady',
			false,
			KNOBS_GROUPS.CardFooter
		),
		justify: select(
			'CardFooter: justify',
			{
				flexStart: 'flex-start',
				flexEnd: 'flex-end',
				center: 'center',
				spaceAround: 'space-around',
				spaceBetween: 'space-between',
				spaceEvenly: 'space-evenly',
			},
			'space-between',
			KNOBS_GROUPS.CardFooter
		),
		size: select(
			'CardFooter: size',
			{
				'unset (defaults to the value set on the <Card> parent)': PROP_UNSET,
				large: 'large',
				medium: 'medium',
				small: 'small',
				xSmall: 'xSmall',
			},
			PROP_UNSET,
			KNOBS_GROUPS.CardFooter
		),
	};

	// Do not pass the `size` and `isBorderless` props when their value is `undefined`.
	// This allows the `CardHeader`, `CardBody` and `CardFooter` components to use
	// the values that are set on the parent `Card` component by default.
	for ( const componentProps of [
		cardHeaderProps,
		cardFooterProps,
		cardBodyProps,
	] ) {
		for ( const prop of [ 'isBorderless', 'size' ] ) {
			if ( componentProps[ prop ] === PROP_UNSET ) {
				delete componentProps[ prop ];
			}
		}
	}

	return (
		<Card { ...cardProps }>
			<CardHeader { ...cardHeaderProps }>
				<Heading>CardHeader</Heading>
			</CardHeader>
			<CardBody { ...cardBodyProps }>
				<Text>CardBody</Text>
			</CardBody>
			<CardBody { ...cardBodyProps }>
				<Text>CardBody (before CardDivider)</Text>
			</CardBody>
			<CardDivider />
			<CardBody { ...cardBodyProps }>
				<Text>CardBody (after CardDivider)</Text>
			</CardBody>
			<CardMedia>
				<img
					alt="Card Media"
					src="https://images.unsplash.com/photo-1566125882500-87e10f726cdc?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1867&q=80"
				/>
			</CardMedia>
			<CardFooter { ...cardFooterProps }>
				<Text>CardFooter</Text>
				<Button variant="secondary">Action Button</Button>
			</CardFooter>
		</Card>
	);
};
