/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockList from '../block-list';

export default function LiveBlockPreview( {
	onClick,
	__experimentalIsRootContainer,
} ) {
	return (
		<div
			tabIndex={ 0 }
			role="button"
			onClick={ onClick }
			onKeyPress={ onClick }
		>
			<Disabled>
				<BlockList
					renderAppender={ false }
					__experimentalIsRootContainer={
						__experimentalIsRootContainer
					}
				/>
			</Disabled>
		</div>
	);
}
