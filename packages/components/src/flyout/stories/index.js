/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CardBody, CardHeader } from '../../card';
import { Flyout } from '..';

export default {
	component: Flyout,
	title: 'Components (Experimental)/Flyout',
};

export const _default = () => {
	const [ isOpen, setIsOpen ] = useState( false );
	return (
		<Flyout text="Click" isOpen={ isOpen } onToggle={ setIsOpen }>
			<CardHeader>Go</CardHeader>
			<CardBody>Stuff</CardBody>
		</Flyout>
	);
};
