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
	__experimentalAsButton = true,
} ) {
	const blockList = (
		<Disabled className="block-editor-block-preview__live-content">
			<BlockList />
		</Disabled>
	);

	return __experimentalAsButton ? (
		<div
			tabIndex={ 0 }
			role="button"
			onClick={ onClick }
			onKeyPress={ onClick }
		>
			{ blockList }
		</div>
	) : (
		<>{ blockList }</>
	);
}
