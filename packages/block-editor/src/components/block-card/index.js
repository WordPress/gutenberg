/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';

const { Badge } = unlock( componentsPrivateApis );

/**
 * A card component that displays block information including title, icon, and description.
 * Can be used to show block metadata and navigation controls for parent blocks.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-card/README.md
 *
 * @example
 * ```jsx
 * function Example() {
 *   return (
 *     <BlockCard
 *       title="My Block"
 *       icon="smiley"
 *       description="A simple block example"
 *       name="Custom Block"
 *     />
 *   );
 * }
 * ```
 *
 * @param {Object}        props             Component props.
 * @param {string}        props.title       The title of the block.
 * @param {string|Object} props.icon        The icon of the block. This can be any of [WordPress' Dashicons](https://developer.wordpress.org/resource/dashicons/), or a custom `svg` element.
 * @param {string}        props.description The description of the block.
 * @param {Object}        [props.blockType] Deprecated: Object containing block type data.
 * @param {string}        [props.className] Additional classes to apply to the card.
 * @param {string}        [props.name]      Custom block name to display before the title.
 * @return {Element}                        Block card component.
 */
function BlockCard( { title, icon, description, blockType, className, name } ) {
	if ( blockType ) {
		deprecated( '`blockType` property in `BlockCard component`', {
			since: '5.7',
			alternative: '`title, icon and description` properties',
		} );
		( { title, icon, description } = blockType );
	}

	const { parentNavBlockClientId } = useSelect( ( select ) => {
		const { getSelectedBlockClientId, getBlockParentsByBlockName } =
			select( blockEditorStore );

		const _selectedBlockClientId = getSelectedBlockClientId();

		return {
			parentNavBlockClientId: getBlockParentsByBlockName(
				_selectedBlockClientId,
				'core/navigation',
				true
			)[ 0 ],
		};
	}, [] );

	const { selectBlock } = useDispatch( blockEditorStore );

	return (
		<div className={ clsx( 'block-editor-block-card', className ) }>
			{ parentNavBlockClientId && ( // This is only used by the Navigation block for now. It's not ideal having Navigation block specific code here.
				<Button
					onClick={ () => selectBlock( parentNavBlockClientId ) }
					label={ __( 'Go to parent Navigation block' ) }
					style={
						// TODO: This style override is also used in ToolsPanelHeader.
						// It should be supported out-of-the-box by Button.
						{ minWidth: 24, padding: 0 }
					}
					icon={ isRTL() ? chevronRight : chevronLeft }
					size="small"
				/>
			) }
			<BlockIcon icon={ icon } showColors />
			<VStack spacing={ 1 }>
				<h2 className="block-editor-block-card__title">
					<span className="block-editor-block-card__name">
						{ !! name?.length ? name : title }
					</span>
					{ !! name?.length && <Badge>{ title }</Badge> }
				</h2>
				{ description && (
					<Text className="block-editor-block-card__description">
						{ description }
					</Text>
				) }
			</VStack>
		</div>
	);
}

export default BlockCard;
