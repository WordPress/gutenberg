/**
 * WordPress dependencies
 */
import {
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { useDispatch, useRegistry } from '@wordpress/data';
import { isRTL, __ } from '@wordpress/i18n';
import {
	formatListBullets,
	formatListBulletsRTL,
	formatListNumbered,
	formatListNumberedRTL,
} from '@wordpress/icons';
import { useEffect, Platform } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import OrderedListSettings from './ordered-list-settings';
import { migrateToListV2 } from './utils';
import TagName from './tag-name';

const TEMPLATE = [ [ 'core/list-item' ] ];
const NATIVE_MARGIN_SPACING = 8;

/**
 * At the moment, deprecations don't handle create blocks from attributes
 * (like when using CPT templates). For this reason, this hook is necessary
 * to avoid breaking templates using the old list block format.
 *
 * @param {Object} attributes Block attributes.
 * @param {string} clientId   Block client ID.
 */
function useMigrateOnLoad( attributes, clientId ) {
	const registry = useRegistry();
	const { updateBlockAttributes, replaceInnerBlocks } =
		useDispatch( blockEditorStore );

	useEffect( () => {
		// As soon as the block is loaded, migrate it to the new version.

		if ( ! attributes.values ) {
			return;
		}

		const [ newAttributes, newInnerBlocks ] = migrateToListV2( attributes );

		deprecated( 'Value attribute on the list block', {
			since: '6.0',
			version: '6.5',
			alternative: 'inner blocks',
		} );

		registry.batch( () => {
			updateBlockAttributes( clientId, newAttributes );
			replaceInnerBlocks( clientId, newInnerBlocks );
		} );
	}, [ attributes.values ] );
}

export default function Edit( { attributes, setAttributes, clientId, style } ) {
	const { ordered, type, reversed, start } = attributes;
	const blockProps = useBlockProps( {
		style: {
			...( Platform.isNative && style ),
			listStyleType: ordered && type !== 'decimal' ? type : undefined,
		},
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'core/list-item' ],
		template: TEMPLATE,
		templateLock: false,
		templateInsertUpdatesSelection: true,
		...( Platform.isNative && {
			marginVertical: NATIVE_MARGIN_SPACING,
			marginHorizontal: NATIVE_MARGIN_SPACING,
			renderAppender: false,
		} ),
		__experimentalCaptureToolbars: true,
	} );
	useMigrateOnLoad( attributes, clientId );

	const controls = (
		<BlockControls group="block">
			<ToolbarButton
				icon={ isRTL() ? formatListBulletsRTL : formatListBullets }
				title={ __( 'Unordered' ) }
				describedBy={ __( 'Convert to unordered list' ) }
				isActive={ ordered === false }
				onClick={ () => {
					setAttributes( { ordered: false } );
				} }
			/>
			<ToolbarButton
				icon={ isRTL() ? formatListNumberedRTL : formatListNumbered }
				title={ __( 'Ordered' ) }
				describedBy={ __( 'Convert to ordered list' ) }
				isActive={ ordered === true }
				onClick={ () => {
					setAttributes( { ordered: true } );
				} }
			/>
		</BlockControls>
	);

	return (
		<>
			<TagName
				ordered={ ordered }
				reversed={ reversed }
				start={ start }
				{ ...innerBlocksProps }
			/>
			{ controls }
			{ ordered && (
				<OrderedListSettings
					{ ...{
						setAttributes,
						reversed,
						start,
						type,
					} }
				/>
			) }
		</>
	);
}
