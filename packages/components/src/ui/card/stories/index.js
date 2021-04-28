/**
 * Internal dependencies
 */
import { Grid } from '../../grid';
import Text from '../../../text';
import { VStack } from '../../v-stack';
import { Card, CardBody, CardFooter } from '../index';
import { Divider } from '../../divider';
import { Heading } from '../../heading';
import Button from '../../../button';

export default {
	component: Card,
	title: 'G2 Components (Experimental)/Card',
};

const ExampleCard = () => {
	return (
		<Card>
			<VStack expanded>
				<CardBody>
					<VStack>
						<Heading>WordPress.org</Heading>
						<Text>Code is Poetry</Text>
					</VStack>
				</CardBody>
				<Divider />
				<CardBody>
					<VStack>
						<Heading>WordPress.org</Heading>
						<Text>Code is Poetry</Text>
					</VStack>
				</CardBody>
				<Divider />
				<CardFooter>
					<Button>Action</Button>
				</CardFooter>
			</VStack>
		</Card>
	);
};
export const adaptiveHeight = () => {
	return (
		<Grid columns={ [ 1, 2, 4 ] }>
			<ExampleCard />
			<ExampleCard />
			<ExampleCard />
			<ExampleCard />
			<ExampleCard />
			<ExampleCard />
			<ExampleCard />
			<ExampleCard />
		</Grid>
	);
};

export const _default = () => {
	return (
		<Card elevation={ 5 } isBorderless>
			<CardBody>Card</CardBody>
		</Card>
	);
};
