import { Button, ToggleControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { keyboardReturn } from '@wordpress/icons';
import URLPopover from '../';

const meta = {
	title: 'BlockEditor/URLPopover',
	component: URLPopover,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Popover component used for editing and viewing URLs.',
			},
		},
	},
	argTypes: {
		onClose: {
			action: 'onClose',
			description: 'Callback when the popover is closed.',
			table: {
				type: { summary: 'function' },
			},
		},
		renderSettings: {
			description: 'Callback to render settings inside the popover.',
			table: {
				type: { summary: 'function' },
			},
			control: false,
		},
		placement: {
			control: { type: 'text' },
			description: 'Placement of the popover relative to its parent.',
			defaultValue: 'bottom',
			table: {
				type: { summary: 'string' },
			},
		},
		focusOnMount: {
			control: { type: 'boolean' },
			description:
				'Controls which element is focused when the popover mounts.',
			defaultValue: true,
			table: {
				type: { summary: 'boolean' },
			},
		},
	},
	args: {
		placement: 'bottom',
		focusOnMount: true,
	},
};

export default meta;

export const Default = {
	render: function Template( { onChange, ...args } ) {
		const [ isVisible, setIsVisible ] = useState( false );
		const [ url, setUrl ] = useState( '' );
		const [ isOpenInNewTab, setIsOpenInNewTab ] = useState( false );

		// Close the popover.
		const closePopover = () => setIsVisible( false );

		return (
			<>
				<Button
					__next40pxDefaultSize
					onClick={ () => setIsVisible( true ) }
				>
					{ __( 'Edit URL' ) }
				</Button>
				{ isVisible && (
					<URLPopover
						{ ...args }
						onClose={ closePopover }
						renderSettings={ () => (
							<ToggleControl
								label={ __( 'Open in new tab' ) }
								checked={ isOpenInNewTab }
								onChange={ setIsOpenInNewTab }
							/>
						) }
					>
						<form
							onSubmit={ ( e ) => {
								e.preventDefault();
								closePopover();
							} }
						>
							<input
								type="url"
								placeholder={ __( 'Enter URL' ) }
								value={ url }
								onChange={ ( e ) => setUrl( e.target.value ) }
							/>
							<Button
								__next40pxDefaultSize
								icon={ keyboardReturn }
								label={ __( 'Apply' ) }
								type="submit"
							/>
						</form>
					</URLPopover>
				) }
			</>
		);
	},
	args: {
		placement: 'bottom',
		focusOnMount: true,
		onClose: () => {},
	},
};
