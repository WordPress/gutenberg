import { useRef, useState } from '@wordpress/element';
import { Button, Input, Stack } from '@wordpress/ui';

export function FilePickerButton() {
	const inputRef = useRef< HTMLInputElement >( null );
	const [ fileName, setFileName ] = useState( '' );

	return (
		<Stack direction="row" align="center" gap="sm">
			<Button
				variant="outline"
				tone="neutral"
				onClick={ () => inputRef.current?.click() }
			>
				Choose file…
			</Button>
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
