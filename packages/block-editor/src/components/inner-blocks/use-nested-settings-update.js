/**
 * WordPress dependencies
 */
import { useLayoutEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * This hook is a side efect which updates the block-editor store when changes
 * happen to inner block settings. The given props are transformed into a
 * settings object, and if that is different from the current settings object in
 * the block-ediotr store, then the store is updated with the new settings which
 * came from props.
 *
 * @param {string}   clientId        The client ID of the block to update.
 * @param {string[]} allowedBlocks   An array of block names which are permitted
 *                                   in inner blocks.
 * @param {string}   [templateLock]  The template lock specified for the inner
 *                                   blocks component. (e.g. "all")
 * @param {boolean}  captureToolbars Whether or children toolbars should be shown
 *                                   in the inner blocks component rather than on
 *                                   the child block.
 * @param {string} __experimentalMoverDirection The direction in which the block
 *                                   should face.
 */
export default function useNestedSettingsUpdate(
	clientId,
	allowedBlocks,
	templateLock,
	captureToolbars,
	__experimentalMoverDirection
) {
	const { updateBlockListSettings } = useDispatch( 'core/block-editor' );

	const { blockListSettings, parentLock } = useSelect(
		( select ) => {
			const rootClientId = select(
				'core/block-editor'
			).getBlockRootClientId( clientId );
			return {
				blockListSettings: select(
					'core/block-editor'
				).getBlockListSettings( clientId ),
				parentLock: select( 'core/block-editor' ).getTemplateLock(
					rootClientId
				),
			};
		},
		[ clientId ]
	);

	useLayoutEffect( () => {
		const newSettings = {
			allowedBlocks,
			templateLock:
				templateLock === undefined ? parentLock : templateLock,
		};

		// These values are not defined for RN, so only include them if they
		// are defined.
		if ( captureToolbars !== undefined ) {
			newSettings.__experimentalCaptureToolbars = captureToolbars;
		}

		if ( __experimentalMoverDirection !== undefined ) {
			newSettings.__experimentalMoverDirection = __experimentalMoverDirection;
		}

		if ( ! isShallowEqual( blockListSettings, newSettings ) ) {
			updateBlockListSettings( clientId, newSettings );
		}
	}, [
		clientId,
		blockListSettings,
		allowedBlocks,
		templateLock,
		parentLock,
		captureToolbars,
		__experimentalMoverDirection,
		updateBlockListSettings,
	] );
}
