/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { NavigableMenu } from '@wordpress/components';
import { BlockIcon } from '@wordpress/blocks';

export default class InserterGroup extends Component {
	constructor() {
		super( ...arguments );
		const { blocks } = this.props;

		this.onNavigate = this.onNavigate.bind( this );

		this.state = {
			current: blocks[ 0 ] ? blocks[ 0 ].name : null,
		};
	}

	isDisabledBlock( blockType ) {
		return blockType.useOnce && find( this.props.blocks, ( { name } ) => blockType.name === name );
	}

	renderItem( block ) {
		const { current } = this.state;
		const disabled = this.isDisabledBlock( block );
		const { selectBlock, bindReferenceNode } = this.props;
		return (
			<button
				role="menuitem"
				key={ block.name }
				className="editor-inserter__block"
				onClick={ selectBlock( block.name ) }
				ref={ bindReferenceNode( block.name ) }
				tabIndex={ current === block.name ? null : '-1' }
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
		const { blocks } = this.props;
		const dest = blocks[ index ];
		if ( dest ) {
			this.setState( {
				current: dest.name,
			} );
		}
	}

	render() {
		const { labelledBy, blocks } = this.props;

		return <NavigableMenu
			className="editor-inserter__category-blocks"
			orientation="vertical"
			aria-labelledby={ labelledBy }
			cycle={ false }
			onNavigate={ this.onNavigate }>
			{ blocks.map( ( block ) => this.renderItem( block ) ) }
		</NavigableMenu>;
	}
}
