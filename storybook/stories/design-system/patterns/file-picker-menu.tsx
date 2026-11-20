import { FormFileUpload } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { Button, Menu, Stack } from '@wordpress/ui';

export function FilePickerMenu() {
	const [ fileName, setFileName ] = useState( '' );

	return (
		<Stack direction="column" align="flex-start" gap="sm">
			<FormFileUpload
				onChange={ ( { currentTarget } ) => {
					const file = currentTarget.files?.[ 0 ];
					if ( file ) {
						setFileName( file.name );
						currentTarget.value = '';
					}
				} }
				render={ ( { openFileDialog } ) => (
					<Menu.Root>
						<Menu.Trigger
							render={
								<Button variant="outline" tone="neutral" />
							}
						>
							Actions
						</Menu.Trigger>
						<Menu.Popup>
							<Menu.Item onClick={ openFileDialog }>
								<Menu.ItemLabel>Choose file…</Menu.ItemLabel>
							</Menu.Item>
						</Menu.Popup>
					</Menu.Root>
				) }
			/>
			<output style={ { overflowWrap: 'anywhere' } }>{ fileName }</output>
		</Stack>
	);
}
