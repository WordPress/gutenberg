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
};

const KNOBS_GROUPS = {
	Card: 'Card',
	CardHeader: 'CardHeader',
	CardFooter: 'CardFooter',
};

export const _default = () => {
	const cardProps = {
		isBorderless: boolean( 'Card: isBorderless', false, KNOBS_GROUPS.Card ),
		elevation: number( 'Card: elevation', 0, {}, KNOBS_GROUPS.Card ),
		size: select(
			'Card: size',
			{
				large: 'large',
				medium: 'medium',
				small: 'small',
				xSmall: 'xSmall',
				none: 'none',
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
		isShady: boolean(
			'CardHeader: isShady',
			false,
			KNOBS_GROUPS.CardHeader
		),
	};

	const cardFooterProps = {
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
	};

	return (
		<Card { ...cardProps }>
			<CardHeader { ...cardHeaderProps }>
				<Heading>CardHeader</Heading>
			</CardHeader>
			<CardBody>
				<Text>CardBody</Text>
			</CardBody>
			<CardBody>
				<Text>CardBody (before CardDivider)</Text>
			</CardBody>
			<CardDivider />
			<CardBody>
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
