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
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { BlockMoverUpButton, BlockMoverDownButton } from './button';

export class BlockMover extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isFocused: false,
		};
		this.onFocus = this.onFocus.bind( this );
		this.onBlur = this.onBlur.bind( this );
	}

	onFocus() {
		this.setState( {
			isFocused: true,
		} );
	}

	onBlur() {
		this.setState( {
			isFocused: false,
		} );
	}

	render() {
		const {
			isFirst,
			isLast,
			clientIds,
			isLocked,
			isHidden,
			rootClientId,
			__experimentalOrientation: orientation,
		} = this.props;
		const { isFocused } = this.state;
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
					<ToolbarItem
						onFocus={ this.onFocus }
						onBlur={ this.onBlur }
					>
						{ ( itemProps ) => (
							<BlockMoverUpButton
								clientIds={ clientIds }
								{ ...itemProps }
							/>
						) }
					</ToolbarItem>
					<ToolbarItem
						onFocus={ this.onFocus }
						onBlur={ this.onBlur }
					>
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
}

export default withSelect( ( select, { clientIds } ) => {
	const {
		getBlock,
		getBlockIndex,
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
	};
} )( BlockMover );
