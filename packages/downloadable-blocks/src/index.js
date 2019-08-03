/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

function DownloadableBlocks( { onSelect, filterValue } ) {
	return (
		<div>
			{ filterValue }
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
