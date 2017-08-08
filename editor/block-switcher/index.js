/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { uniq, get, reduce, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Toolbar, DropdownMenu } from '@wordpress/components';
import { getBlockType, getBlockTypes, switchToBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import { replaceBlocks } from '../actions';
import { getBlock } from '../selectors';

class BlockSwitcher extends Component {

	switchBlockType( name ) {
		return () => {
			this.props.onTransform( this.props.block, name );
		};
	}

	render() {
		const blockType = getBlockType( this.props.block.name );
		const blocksToBeTransformedFrom = reduce( getBlockTypes(), ( memo, block ) => {
			const transformFrom = get( block, 'transforms.from', [] );
			const transformation = find( transformFrom, t => t.type === 'block' && t.blocks.indexOf( this.props.block.name ) !== -1 );
			return transformation ? memo.concat( [ block.name ] ) : memo;
		}, [] );
		const blocksToBeTransformedTo = get( blockType, 'transforms.to', [] )
			.reduce( ( memo, transformation ) => memo.concat( transformation.blocks ), [] );
		const allowedBlocks = uniq( blocksToBeTransformedFrom.concat( blocksToBeTransformedTo ) )
			.reduce( ( memo, name ) => {
				const block = getBlockType( name );
				return !! block ? memo.concat( block ) : memo;
			}, [] );

		if ( ! allowedBlocks.length ) {
			return null;
		}

		return (
			<Toolbar>
				<li>
					<DropdownMenu
						icon={ blockType.icon }
						label={ __( 'Change block type' ) }
						controls={
						allowedBlocks.map( ( { name, title, icon } ) => ( {
							icon,
							title,
							onClick: this.switchBlockType( name ),
						} ) )	}
						tabIndex="-1"
					/>
				</li>
			</Toolbar>
		);
	}
}

export default connect(
	( state, ownProps ) => ( {
		block: getBlock( state, ownProps.uid ),
	} ),
	( dispatch, ownProps ) => ( {
		onTransform( block, name ) {
			dispatch( replaceBlocks(
				[ ownProps.uid ],
				switchToBlockType( block, name )
			) );
		},
	} )
)( BlockSwitcher );
