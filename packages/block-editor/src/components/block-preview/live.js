/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { BlockListItems } from '../block-list';

const DEFAULT_CONTROLS = [ 'none', 'left', 'center', 'right', 'wide', 'full' ];
const WIDE_CONTROLS = [ 'wide', 'full' ];

const layout = {
	type: 'default',
	alignments: [ ...DEFAULT_CONTROLS, ...WIDE_CONTROLS ],
};

export default function LiveBlockPreview( {
	onClick,
	__experimentalAsButton = true,
	themeSupportsLayout = false,
} ) {
	let blockList;

	if ( __experimentalAsButton ) {
		blockList = (
			<Disabled className="block-editor-block-preview__live-content">
				<BlockListItems />
			</Disabled>
		);
	} else {
		const props = {};
		if ( themeSupportsLayout ) {
			props.__experimentalLayout = layout;
		}
		blockList = <BlockListItems { ...props } />;
	}

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
