/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { uniq, get, reduce, noop } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import IconButton from 'components/icon-button';

class BlockSwitcher extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.toggleMenu = this.toggleMenu.bind( this );
		this.state = {
			open: false
		};
	}

	toggleMenu() {
		this.setState( {
			open: ! this.state.open
		} );
	}

	switchBlockType( blockType ) {
		return () => {
			this.setState( {
				open: false
			} );
			this.props.onTransform( this.props.block, blockType );
		};
	}

	render() {
		const { block } = this.props;

		const blockSettings = wp.blocks.getBlockSettings( block.blockType );
		const blocksToBeTransformedFrom = reduce( wp.blocks.getBlocks(), ( memo, block ) => {
			const transformFrom = get( block, 'transforms.from', [] );
			const transformation = transformFrom.find( t => t.blocks.indexOf( block.blockType ) !== -1 );
			return transformation ? memo.concat( [ block.slug ] ) : memo;
		}, [] );
		const blocksToBeTransformedTo = get( blockSettings, 'transforms.to', [] )
			.reduce( ( memo, transformation ) => memo.concat( transformation.blocks ), [] );
		const allowedBlocks = uniq( blocksToBeTransformedFrom.concat( blocksToBeTransformedTo ) )
			.reduce( ( memo, blockType ) => {
				const block = wp.blocks.getBlockSettings( blockType );
				return !! block ? memo.concat( block ) : memo;
			}, [] );

		if ( ! allowedBlocks.length ) {
			return null;
		}

		return (
			<div className="editor-block-switcher">
				<IconButton
					className="editor-block-switcher__toggle"
					icon={ blockSettings.icon }
					onClick={ this.toggleMenu }
				>
					<div className="editor-block-switcher__arrow" />
				</IconButton>
				{ this.state.open &&
					<div className="editor-block-switcher__menu">
						<div className="editor-block-switcher__menu-arrow" />
						{ allowedBlocks.map(
							newBlock => this.renderAllowedBlock( block, newBlock )
						) }
					</div>
				}
			</div>
		);
	}

	renderAllowedBlock( currentBlock, newBlockSettings ) {
		const newBlockAttributes = wp.blocks.switchToBlockType(
			currentBlock,
			newBlockSettings.slug
		);
		const disabled = ( newBlockAttributes instanceof Error );
		const disabledMessage = disabled ? newBlockAttributes.message : null;
		const { slug, title, icon } = newBlockSettings;
		return (
			<IconButton
				key={ slug }
				onClick={ disabled ? noop : this.switchBlockType( slug ) }
				className="editor-block-switcher__menu-item"
				icon={ icon }
				disabled={ disabled }
				tooltip={ disabledMessage }
			>
				{ title }
			</IconButton>
		);
	}
}

export default connect(
	( state, ownProps ) => ( {
		block: state.blocks.byUid[ ownProps.uid ]
	} ),
	( dispatch, ownProps ) => ( {
		onTransform( block, blockType ) {
			block = wp.blocks.switchToBlockType( block, blockType );
			if ( block instanceof Error ) {
				return;
			}
			dispatch( {
				type: 'SWITCH_BLOCK_TYPE',
				uid: ownProps.uid,
				block,
			} );
		}
	} )
)( BlockSwitcher );
