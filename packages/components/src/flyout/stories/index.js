/**
 * Internal dependencies
 */
import { CardBody, CardHeader } from '../../card';
import Button from '../../button';
import { Flyout } from '..';

export default {
	component: Flyout,
	title: 'Components (Experimental)/Flyout',
};

export const _default = () => {
	return (
		<Flyout
			trigger={ <Button>Click</Button> }
			visible
			placement="bottom-start"
		>
			<CardHeader>Go</CardHeader>
			<CardBody>Stuff</CardBody>
		</Flyout>
	);
};
