import { speak } from '@wordpress/a11y';
import { FormFileUpload } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { trash, upload } from '@wordpress/icons';
import { Button, Fieldset, Menu, Stack, Text } from '@wordpress/ui';
import { FileSummary } from './selected-file';
import styles from './file-picker.module.css';

export function FilePickerMenu() {
	const [ file, setFile ] = useState< File >();

	return (
		<Fieldset.Root className={ styles.field }>
			<Fieldset.Legend>Logo</Fieldset.Legend>
			{ /*
			 * Wrap the whole menu, not the item: the item unmounts when the
			 * menu closes, and the input must stay mounted to report the
			 * selection.
			 */ }
			<FormFileUpload
				accept=".png,.svg,image/png,image/svg+xml"
				onChange={ ( { currentTarget } ) => {
					const chosen = currentTarget.files?.[ 0 ];
					if ( chosen ) {
						setFile( chosen );
						speak( `${ chosen.name } selected.` );
					}
					currentTarget.value = '';
				} }
				render={ ( { openFileDialog } ) => (
					<Stack
						direction="row"
						align="center"
						justify="space-between"
						gap="sm"
						className={ `${ styles.surface } ${ styles.row }` }
					>
						{ file ? (
							<FileSummary file={ file } />
						) : (
							<Text className={ styles.weak }>No logo</Text>
						) }
						<Menu.Root>
							<Menu.Trigger
								render={
									<Button
										variant="outline"
										tone="neutral"
										size="compact"
									/>
								}
							>
								{ file ? 'Replace' : 'Add' }
							</Menu.Trigger>
							<Menu.Popup>
								<Menu.Item
									prefix={
										<Menu.PrefixIcon icon={ upload } />
									}
									onClick={ openFileDialog }
								>
									<Menu.ItemLabel>
										Choose file…
									</Menu.ItemLabel>
								</Menu.Item>
								{ file && (
									<>
										<Menu.Separator />
										<Menu.Item
											prefix={
												<Menu.PrefixIcon
													icon={ trash }
												/>
											}
											onClick={ () => {
												speak(
													`${ file.name } removed.`
												);
												setFile( undefined );
											} }
										>
											<Menu.ItemLabel>
												Remove
											</Menu.ItemLabel>
										</Menu.Item>
									</>
								) }
							</Menu.Popup>
						</Menu.Root>
					</Stack>
				) }
			/>
			<Fieldset.Description>
				PNG or SVG, at least 512 pixels wide.
			</Fieldset.Description>
		</Fieldset.Root>
	);
}
