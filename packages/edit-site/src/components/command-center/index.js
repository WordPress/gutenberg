import { Command } from 'cmdk';
import { useState } from '@wordpress/element';

export default function CommandCenter( props ) {
	const [ open, setOpen ] = useState( true );

	return (
		<Command.Dialog open={ open } onOpenChange={ setOpen }>
			<Command.Input />

			<Command.List>
				{ /* { loading && <Command.Loading>Hang on…</Command.Loading> } */ }

				<Command.Empty>No results found.</Command.Empty>

				<Command.Group heading="Fruits">
					<Command.Item>Apple</Command.Item>
					<Command.Item>Orange</Command.Item>
					<Command.Separator />
					<Command.Item>Pear</Command.Item>
					<Command.Item>Blueberry</Command.Item>
				</Command.Group>

				<Command.Item>Fish</Command.Item>
			</Command.List>
		</Command.Dialog>
	);
}
