/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Popover from '../..';

export default {
	title: 'Components/Popover',
	component: Popover,
};

export const Default = () => {
	const [ isVisible, setIsVisible ] = useState( false );

	return (
		<button onClick={ () => setIsVisible( ( state ) => ! state ) }>
			Toggle Popover!
			{ isVisible && <Popover>Popover is toggled!</Popover> }
		</button>
	);
};
