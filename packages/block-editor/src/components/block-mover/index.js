/**
 * External dependencies
 */
import { first, last, castArray } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	ToolbarGroup,
	__experimentalToolbarItem as ToolbarItem,
} from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import { useState } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { BlockMoverUpButton, BlockMoverDownButton } from './button';

function BlockMover( {
	isFirst,
	isLast,
	clientIds,
	isLocked,
	isHidden,
	rootClientId,
	orientation,
} ) {
	const [ isFocused, setIsFocused ] = useState( false );

	const onFocus = () => setIsFocused( true );
	const onBlur = () => setIsFocused( false );

	if ( isLocked || ( isFirst && isLast && ! rootClientId ) ) {
		return null;
	}

	// We emulate a disabled state because forcefully applying the `disabled`
	// attribute on the buttons while it has focus causes the screen to change
	// to an unfocused state (body as active element) without firing blur on,
	// the rendering parent, leaving it unable to react to focus out.
	return (
		<div
			className={ classnames( 'block-editor-block-mover', {
				'is-visible': isFocused || ! isHidden,
				'is-horizontal': orientation === 'horizontal',
			} ) }
		>
			<ToolbarGroup>
				<ToolbarItem onFocus={ onFocus } onBlur={ onBlur }>
					{ ( itemProps ) => (
						<BlockMoverUpButton
							clientIds={ clientIds }
							{ ...itemProps }
						/>
					) }
				</ToolbarItem>
				<ToolbarItem onFocus={ onFocus } onBlur={ onBlur }>
					{ ( itemProps ) => (
						<BlockMoverDownButton
							clientIds={ clientIds }
							{ ...itemProps }
						/>
					) }
				</ToolbarItem>
			</ToolbarGroup>
		</div>
	);
}

export default withSelect( ( select, { clientIds } ) => {
	const {
		getBlock,
		getBlockIndex,
		getBlockListSettings,
		getTemplateLock,
		getBlockOrder,
		getBlockRootClientId,
	} = select( 'core/block-editor' );
	const normalizedClientIds = castArray( clientIds );
	const firstClientId = first( normalizedClientIds );
	const block = getBlock( firstClientId );
	const rootClientId = getBlockRootClientId( first( normalizedClientIds ) );
	const firstIndex = getBlockIndex( firstClientId, rootClientId );
	const lastIndex = getBlockIndex(
		last( normalizedClientIds ),
		rootClientId
	);
	const blockOrder = getBlockOrder( rootClientId );
	const isFirst = firstIndex === 0;
	const isLast = lastIndex === blockOrder.length - 1;

	return {
		blockType: block ? getBlockType( block.name ) : null,
		isLocked: getTemplateLock( rootClientId ) === 'all',
		rootClientId,
		firstIndex,
		isFirst,
		isLast,
		orientation: getBlockListSettings( rootClientId )?.orientation,
	};
} )( BlockMover );
