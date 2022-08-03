/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

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

const meta: ComponentMeta< typeof Card > = {
	component: Card,
	subcomponents: { CardHeader, CardBody, CardDivider, CardMedia, CardFooter },
	title: 'Components/Card',
	parameters: {
		controls: {
			expanded: true,
		},
		knobs: { disable: false },
		docs: { source: { state: 'open' } },
	},
};

export default meta;

const Template: ComponentStory< typeof Card > = ( props ) => {
	return (
		<Card { ...props }>
			<CardHeader>
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
			<CardFooter>
				<Text>CardFooter</Text>
				<Button variant="secondary">Action Button</Button>
			</CardFooter>
		</Card>
	);
};

export const Default: ComponentStory< typeof Card > = Template.bind( {} );
Default.args = {};
