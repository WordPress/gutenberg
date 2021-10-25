/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockList from '../block-list';

export default function LiveBlockPreview( { onClick, tabIndex = 0 } ) {
	return (
		<div
			tabIndex={ tabIndex }
			role="button"
			onClick={ onClick }
			onKeyPress={ onClick }
		>
			<Disabled>
				<BlockList />
			</Disabled>
		</div>
	);
}
