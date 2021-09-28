/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockList from '../block-list';

export default function LiveBlockPreview( { onClick } ) {
	return (
		<div
			tabIndex={ 0 }
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
