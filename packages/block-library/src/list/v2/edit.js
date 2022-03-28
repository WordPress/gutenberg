/**
 * WordPress dependencies
 */
import {
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import {
	formatListBullets,
	formatListBulletsRTL,
	formatListNumbered,
	formatListNumberedRTL,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import OrderedListSettings from '../ordered-list-settings';

const TEMPLATE = [ [ 'core/list-item' ] ];

function Edit( { attributes, setAttributes } ) {
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
