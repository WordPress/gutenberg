/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PublicPublishDateTimePicker from '../';

export default {
	title: 'Components/PublicPublishDateTimePicker',
	component: PublicPublishDateTimePicker,
	argTypes: {
		onChange: { action: 'onChange' },
		onClose: { action: 'onClose' },
	},
};

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ currentDate, setCurrentDate ] = useState(
			args.currentDate || null
		);

		return (
			<PublicPublishDateTimePicker
				{ ...args }
				currentDate={ currentDate }
				onChange={ ( date ) => {
					setCurrentDate( date );
					onChange( date );
				} }
			/>
		);
	},
	args: {
		currentDate: new Date().toISOString(),
		showPopoverHeaderActions: true,
	},
};
