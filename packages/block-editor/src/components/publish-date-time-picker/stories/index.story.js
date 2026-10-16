/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { dateI18n } from '@wordpress/date';
import { useState } from '@wordpress/element';
import { Dropdown, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PublicPublishDateTimePicker from '../';

const meta = {
	title: 'BlockEditor/PublishDateTimePicker',
	component: PublicPublishDateTimePicker,
	parameters: {
		docs: {
			description: {
				component:
					'`PublishDateTimePicker` is a component used to select the date and time that a post will be published. It wraps the `DateTimePicker` component found in `@wordpress/components` and adds additional post-specific controls. all of the props that [`DateTimePicker`](/docs/components-datetimepicker--docs) supports, plus onClose',
			},
		},
	},
	argTypes: {
		currentDate: {
			control: 'date',
			description: 'The current date and time.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		onClose: {
			action: 'closed',
			description: 'Called when the date picker is closed.',
			table: {
				type: {
					summary: 'function',
				},
			},
			control: false,
		},
	},
};

export default meta;

const Template = ( args ) => {
	const [ date, setDate ] = useState( args.currentDate || new Date() );

	const formatDate = ( inputDate ) => {
		if ( ! inputDate ) {
			return '';
		}

		const formattedDate = dateI18n(
			// translators: Use a non-breaking space between 'g:i' and 'a' if appropriate.
			_x( 'F j, Y g:i\xa0a', 'post schedule full date format' ),
			inputDate
		);

		return `${ formattedDate } UTC+0`;
	};

	return (
		<Dropdown
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					onClick={ onToggle }
					aria-expanded={ isOpen }
					variant="secondary"
				>
					{ date
						? formatDate( new Date( date ) )
						: __( 'Publish immediately' ) }
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<PublicPublishDateTimePicker
					currentDate={ date }
					onChange={ setDate }
					onClose={ onClose }
				/>
			) }
		/>
	);
};

export const Default = {
	render: Template,
	args: {
		currentDate: new Date().toISOString(),
	},
};
