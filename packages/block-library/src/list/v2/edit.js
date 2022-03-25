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
import { useDispatch, useSelect, select } from '@wordpress/data';
import { isRTL, __, _x } from '@wordpress/i18n';
import {
	formatListBullets,
	formatListBulletsRTL,
	formatListNumbered,
	formatListNumberedRTL,
	formatOutdent,
	formatOutdentRTL,
} from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import OrderedListSettings from '../ordered-list-settings';

const TEMPLATE = [ [ 'core/list-item' ] ];

function IdentUI( { clientId } ) {
	const { canOutdent } = useSelect(
		( innerSelect ) => {
			const { getBlockRootClientId, getBlock } = innerSelect(
				blockEditorStore
			);
			const parentId = getBlockRootClientId( clientId );
			return {
				canOutdent:
					!! parentId &&
					getBlock( parentId ).name === 'core/list-item',
			};
		},
		[ clientId ]
	);
	const { replaceBlocks } = useDispatch( blockEditorStore );

	return (
		<>
			<ToolbarButton
				icon={ isRTL() ? formatOutdentRTL : formatOutdent }
				title={ __( 'Outdent' ) }
				describedBy={ __( 'Outdent list item' ) }
				shortcut={ _x( 'Backspace', 'keyboard key' ) }
				disabled={ ! canOutdent }
				onClick={ () => {
					const {
						getBlockRootClientId,
						getBlockAttributes,
						getBlock,
					} = select( blockEditorStore );
					const parentBlockId = getBlockRootClientId( clientId );
					const parentBlockAttributes = getBlockAttributes(
						parentBlockId
					);
					const { innerBlocks } = getBlock( clientId );
					replaceBlocks(
						[ parentBlockId ],
						[
							createBlock(
								'core/list-item',
								parentBlockAttributes
							),
							...innerBlocks,
						]
					);
				} }
			/>
		</>
	);
}

function Edit( { attributes, setAttributes, clientId } ) {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'core/list-item' ],
		template: TEMPLATE,
	} );
	const { ordered, reversed, start } = attributes;
	const TagName = ordered ? 'ol' : 'ul';

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
			<IdentUI clientId={ clientId } />
		</BlockControls>
	);

	return (
		<>
			<TagName
				reversed={ reversed }
				start={ start }
				{ ...innerBlocksProps }
			/>
			{ controls }
			{ ordered && (
				<OrderedListSettings
					setAttributes={ setAttributes }
					ordered={ ordered }
					reversed={ reversed }
					start={ start }
				/>
			) }
		</>
	);
}

export default Edit;
