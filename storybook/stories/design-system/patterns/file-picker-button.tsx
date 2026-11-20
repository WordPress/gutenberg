import { FormFileUpload } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { Button, Stack } from '@wordpress/ui';

export function FilePickerButton() {
	const [ fileName, setFileName ] = useState( '' );

	return (
		<Stack direction="row" align="center" gap="sm" wrap="wrap">
			<FormFileUpload
				onChange={ ( { currentTarget } ) => {
					const file = currentTarget.files?.[ 0 ];
					if ( file ) {
						setFileName( file.name );
						currentTarget.value = '';
					}
				} }
				render={ ( { openFileDialog } ) => (
					<Button
						variant="outline"
						tone="neutral"
						onClick={ openFileDialog }
					>
						Choose file…
					</Button>
				) }
			/>
			<output style={ { overflowWrap: 'anywhere' } }>{ fileName }</output>
		</Stack>
	);
}
