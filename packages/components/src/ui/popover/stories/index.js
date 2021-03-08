/**
 * Internal dependencies
 */
/**
 * External dependencies
 */
import { Button, CardBody, CardHeader } from '@wp-g2/components';
import { Popover } from '..';

export default {
	component: Popover,
	title: 'G2 Components (Experimental)/Popover',
};

export const _default = () => {
	return (
		<Popover
			trigger={ <Button>Click</Button> }
			visible
			placement="bottom-start"
		>
			<CardHeader>Go</CardHeader>
			<CardBody>Stuff</CardBody>
		</Popover>
	);
};
