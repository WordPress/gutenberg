import { Button, ToggleControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { keyboardReturn } from '@wordpress/icons';
import URLPopover from '../';

const meta = {
	title: 'BlockEditor/URLPopover',
	component: URLPopover,
	parameters: {
		// FIXME: Story uses a raw unstyled input whose placeholder fails color-contrast.
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
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
		additionalControls: {
			description:
				'Additional controls rendered below the input row. They are hidden while the settings drawer is open.',
			table: {
				type: { summary: 'Element' },
			},
			control: false,
		},
		placement: {
			control: { type: 'select' },
			options: [
				'top',
				'top-start',
				'top-end',
				'right',
				'right-start',
				'right-end',
				'bottom',
				'bottom-start',
				'bottom-end',
				'left',
				'left-start',
				'left-end',
				'overlay',
			],
			description: 'Placement of the popover relative to its parent.',
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: "'bottom'" },
			},
		},
		focusOnMount: {
			control: { type: 'select' },
			options: [ 'firstElement', 'firstInputElement', true, false ],
			description:
				'Controls which element is focused when the popover mounts.',
			table: {
				type: {
					summary: "boolean | 'firstElement' | 'firstInputElement'",
				},
				defaultValue: { summary: "'firstElement'" },
			},
		},
	},
	args: {
		placement: 'bottom',
		focusOnMount: 'firstElement',
	},
};

export default meta;

export const Default = {
	render: function Template( { onClose, ...args } ) {
		const [ isVisible, setIsVisible ] = useState( true );
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
						onClose={ ( ...closeArgs ) => {
							onClose( ...closeArgs );
							closePopover();
						} }
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
};
