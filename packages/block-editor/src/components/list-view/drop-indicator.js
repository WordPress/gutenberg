/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useListViewContext } from './context';

export default function ListViewDropIndicator( { listViewRef } ) {
	const { blockDropTarget } = useListViewContext();

	const { clientId, dropPosition } = blockDropTarget || {};

	const blockElement = useMemo( () => {
		if ( ! clientId || ! listViewRef.current ) {
			return;
		}

		return listViewRef.current.ownerDocument.getElementById(
			`list-view-block-${ clientId }`
		);
	}, [ clientId ] );

	const style = useMemo( () => {
		if ( ! blockElement ) {
			return {};
		}

		return {
			width: blockElement.offsetWidth,
		};
	}, [ blockElement ] );

	const getAnchorRect = useCallback( () => {
		if ( ! blockElement ) {
			return {};
		}

		const ownerDocument = blockElement.ownerDocument;
		const rect = blockElement.getBoundingClientRect();

		if ( dropPosition === 'top' ) {
			return {
				top: rect.top,
				bottom: rect.top,
				left: rect.left,
				right: rect.right,
				width: 0,
				height: rect.height,
				ownerDocument,
			};
		}

		if ( dropPosition === 'bottom' || dropPosition === 'inside' ) {
			return {
				top: rect.bottom,
				bottom: rect.bottom,
				left: rect.left,
				right: rect.right,
				width: 0,
				height: rect.height,
				ownerDocument,
			};
		}

		return {};
	}, [ blockElement, dropPosition ] );

	if ( ! clientId ) {
		return null;
	}

	return (
		<Popover
			noArrow
			animate={ false }
			getAnchorRect={ getAnchorRect }
			focusOnMount={ false }
			className="block-editor-list-view-drop-indicator"
		>
			<div
				style={ style }
				className="block-editor-list-view-drop-indicator__line"
			/>
		</Popover>
	);
}
