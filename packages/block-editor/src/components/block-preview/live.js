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
			<div inert="true">
				<BlockList />
			</div>
		</div>
	);
}
