/**
 * External dependencies
 */
import {
	Button,
	Container,
	ListGroup,
	ListGroupHeader,
	ListGroups,
	Select,
	TextInput,
} from '@wp-g2/components';

/**
 * Internal dependencies
 */
import { ControlGroup } from '..';

export default {
	component: ControlGroup,
	title: 'G2 Components (Experimental)/ControlGroup',
};

export const _default = () => {
	return (
		<Container>
			<ListGroups spacing={ 20 }>
				<ListGroup>
					<ListGroupHeader>Grid</ListGroupHeader>
					<ControlGroup templateColumns="auto 1fr 1fr auto">
						<Select options={ [ { label: 'Ms.', value: 'ms' } ] } />
						<TextInput placeholder="First name" />
						<TextInput placeholder="Last name" />
						<Button variant="primary">Submit</Button>
					</ControlGroup>
				</ListGroup>
				<ListGroup>
					<ListGroupHeader>Flex</ListGroupHeader>
					<ControlGroup>
						<Select options={ [ { label: 'Ms.', value: 'ms' } ] } />
						<TextInput placeholder="First name" />
						<TextInput placeholder="Last name" />
						<Button variant="primary">Submit</Button>
					</ControlGroup>
				</ListGroup>
			</ListGroups>
		</Container>
	);
};
