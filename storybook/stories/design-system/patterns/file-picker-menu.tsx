import { FormFileUpload } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { Menu } from '@wordpress/ui';

export function FilePickerMenu() {
	const [ fileName, setFileName ] = useState( '' );

	return (
		<>
			<FormFileUpload
				onChange={ ( event ) =>
					setFileName( event.currentTarget.files?.[ 0 ]?.name ?? '' )
				}
				render={ ( { openFileDialog } ) => (
					<Menu.Root>
						<Menu.Trigger>Actions</Menu.Trigger>
						<Menu.Popup>
							<Menu.Item onClick={ openFileDialog }>
								<Menu.ItemLabel>Choose file…</Menu.ItemLabel>
							</Menu.Item>
						</Menu.Popup>
					</Menu.Root>
				) }
			/>
			<output>{ fileName }</output>
		</>
	);
}
