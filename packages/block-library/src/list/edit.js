/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import OrderedListSettings from './ordered-list-settings';

export default function ListEdit( { attributes, setAttributes } ) {
	const { ordered, reversed, start, placeholder } = attributes;

	return (
		<>
			<ul>
				<InnerBlocks allowedBlocks={ [ 'core/list-item' ] } />
			</ul>
			{ ordered && (
				<OrderedListSettings
					setAttributes={ setAttributes }
					ordered={ ordered }
					reversed={ reversed }
					start={ start }
					placeholder={ placeholder }
				/>
			) }
		</>
	);
}
