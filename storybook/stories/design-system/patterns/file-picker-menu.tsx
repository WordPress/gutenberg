import { useRef, useState } from '@wordpress/element';
import { Button, Input, Menu, Stack } from '@wordpress/ui';

export function FilePickerMenu() {
	const inputRef = useRef< HTMLInputElement >( null );
	const [ fileName, setFileName ] = useState( '' );

	return (
		<Stack direction="column" align="flex-start" gap="sm">
			<Menu.Root>
				<Menu.Trigger
					render={ <Button variant="outline" tone="neutral" /> }
				>
					Actions
				</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item onClick={ () => inputRef.current?.click() }>
						<Menu.ItemLabel>Choose file…</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
			<div hidden>
				<Input
					ref={ inputRef }
					type="file"
					onChange={ ( event ) => {
						const file = event.currentTarget.files?.[ 0 ];
						setFileName( file?.name ?? '' );
					} }
				/>
			</div>
			<output>{ fileName }</output>
		</Stack>
	);
}
