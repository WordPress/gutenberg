/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

function DownloadableBlocks( { onSelect } ) {
	return (
		<div>
			Hello from the other side.
			<Button
				isDefault
				onClick={ ( event ) => {
					event.preventDefault();
					onSelect( {} );
				} }
			>
				Add
			</Button>
		</div>
	);
}

export default DownloadableBlocks;
