/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import { getBlockDOMNode } from '../../utils/dom';

export default function InsertionPoint( { children } ) {
	const { order, IP } = useSelect( ( select ) => {
		const { getBlockInsertionPoint, getBlockOrder } = select(
			'core/block-editor'
		);

		const insertionPoint = getBlockInsertionPoint();

		return {
			IP: insertionPoint,
			order: getBlockOrder( insertionPoint.rootClientId ),
		};
	} );

	const clientId = order[ IP.index - 1 ];
	const element = getBlockDOMNode( clientId );

	// should be visible only when the user has hovered over the inserter
	const shouldShow = order.length !== IP.index;

	return (
		<>
			{ shouldShow && (
				<Popover
					anchorRef={ element }
					position="bottom right left"
					focusOnMount={ false }
				>
					<div
						className="block-editor-block-list__insertion-point-inserter"
						style={ { position: 'fixed' } }
					>
						<Inserter
							position="bottom center"
							clientId={ clientId }
							__experimentalIsQuick
						/>
					</div>
					<div
						style={ {
							left: '14px',
							right: '14px',
							backgroundColor: 'red',
							height: '2px',
							width: element?.offsetWidth,
						} }
					/>
				</Popover>
			) }
			{ children }
		</>
	);
}
