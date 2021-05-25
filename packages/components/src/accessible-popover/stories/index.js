/**
 * Internal dependencies
 */
import { CardBody, CardHeader } from '../../card';
import Button from '../../button';
import { AccessiblePopover } from '..';

export default {
	component: AccessiblePopover,
	title: 'Components (Experimental)/AccessiblePopover',
};

export const _default = () => {
	return (
		<AccessiblePopover
			trigger={ <Button>Click</Button> }
			visible
			placement="bottom-start"
		>
			<CardHeader>Go</CardHeader>
			<CardBody>Stuff</CardBody>
		</AccessiblePopover>
	);
};
