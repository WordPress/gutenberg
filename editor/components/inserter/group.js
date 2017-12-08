/**
 * External dependencies
 */
import { isEqual, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { NavigableMenu } from '@wordpress/components';
import { BlockIcon } from '@wordpress/blocks';

function deriveActiveBlocks( blocks ) {
	return blocks.filter( ( block ) => ! block.disabled );
}

export default class InserterGroup extends Component {
	constructor() {
		super( ...arguments );

		this.onNavigate = this.onNavigate.bind( this );

		this.activeBlocks = deriveActiveBlocks( this.props.blockTypes );
		this.state = {
			current: this.activeBlocks.length > 0 ? this.activeBlocks[ 0 ].name : null,
		};
	}

	componentWillReceiveProps( nextProps ) {
		if ( ! isEqual( this.props.blockTypes, nextProps.blockTypes ) ) {
			this.activeBlocks = deriveActiveBlocks( nextProps.blockTypes );
			// Try and preserve any still valid selected state.
			const current = find( this.activeBlocks, { name: this.state.current } );
			if ( ! current ) {
				this.setState( {
					current: this.activeBlocks.length > 0 ? this.activeBlocks[ 0 ].name : null,
				} );
			}
		}
	}

	renderItem( block ) {
		const { current } = this.state;
		const { selectBlock, bindReferenceNode } = this.props;
		const { disabled } = block;
		return (
			<button
				role="menuitem"
				key={ block.name }
				className="editor-inserter__block"
				onClick={ selectBlock( block ) }
				ref={ bindReferenceNode( block.name ) }
				tabIndex={ current === block.name || disabled ? null : '-1' }
				onMouseEnter={ ! disabled ? this.props.showInsertionPoint : null }
				onMouseLeave={ ! disabled ? this.props.hideInsertionPoint : null }
				disabled={ disabled }
			>
				<BlockIcon icon={ block.icon } />
				{ block.title }
			</button>
		);
	}

	onNavigate( index ) {
		const { activeBlocks } = this;
		const dest = activeBlocks[ index ];
		if ( dest ) {
			this.setState( {
				current: dest.name,
			} );
		}
	}

	render() {
		const { labelledBy, blockTypes } = this.props;

		return (
			<NavigableMenu
				className="editor-inserter__category-blocks"
				orientation="vertical"
				aria-labelledby={ labelledBy }
				cycle={ false }
				onNavigate={ this.onNavigate }>
				{ blockTypes.map( this.renderItem, this ) }
			</NavigableMenu>
		);
	}
}
