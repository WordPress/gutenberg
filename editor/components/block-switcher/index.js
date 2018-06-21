/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, Dashicon, IconButton, Toolbar, PanelBody } from '@wordpress/components';
import { getBlockType, getPossibleBlockTransformations, switchToBlockType } from '@wordpress/blocks';
import { compose, Component, Fragment } from '@wordpress/element';
import { keycodes } from '@wordpress/utils';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockIcon from '../block-icon';
import BlockStyles from '../block-styles';
import BlockPreview from '../block-preview';

/**
 * Module Constants
 */
const { DOWN } = keycodes;

export class BlockSwitcher extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			hoveredClassName: null,
		};
		this.onHoverClassName = this.onHoverClassName.bind( this );
	}

	onHoverClassName( className ) {
		this.setState( { hoveredClassName: className } );
	}

	render() {
		const { blocks, onTransform, isLocked } = this.props;
		const { hoveredClassName } = this.state;
		const allowedBlocks = getPossibleBlockTransformations( blocks );

		if ( isLocked || ! allowedBlocks.length ) {
			return null;
		}

		const sourceBlockName = blocks[ 0 ].name;
		const blockType = getBlockType( sourceBlockName );
		const hasStyles = blocks.length === 1 && get( blockType, [ 'transforms', 'styles' ], [] ).length !== 0;

		return (
			<Dropdown
				position="bottom right"
				className="editor-block-switcher"
				contentClassName="editor-block-switcher__popover"
				renderToggle={ ( { onToggle, isOpen } ) => {
					const openOnArrowDown = ( event ) => {
						if ( ! isOpen && event.keyCode === DOWN ) {
							event.preventDefault();
							event.stopPropagation();
							onToggle();
						}
					};
					const label = __( 'Change block type' );

					return (
						<Toolbar>
							<IconButton
								className="editor-block-switcher__toggle"
								icon={ <BlockIcon icon={ blockType.icon && blockType.icon.src } /> }
								onClick={ onToggle }
								aria-haspopup="true"
								aria-expanded={ isOpen }
								label={ label }
								tooltip={ label }
								onKeyDown={ openOnArrowDown }
							>
								<Dashicon icon="arrow-down" />
							</IconButton>
						</Toolbar>
					);
				} }
				renderContent={ ( { onClose } ) => (
					<Fragment>
						{ hasStyles &&
						<PanelBody
							title={ __( 'Block Styles' ) }
							initialOpen
						>
							<BlockStyles uid={ blocks[ 0 ].uid } onSwitch={ onClose } onHoverClassName={ this.onHoverClassName } />
						</PanelBody>
						}
						<PanelBody
							title={ __( 'Block transforms' ) }
							initialOpen={ ! hasStyles }
						>
							{ allowedBlocks.map( ( { name, title, icon } ) => (
								<IconButton
									key={ name }
									onClick={ () => {
										onTransform( blocks, name );
										onClose();
									} }
									className="editor-block-switcher__transform"
									icon={ (
										<span className="editor-block-switcher__block-icon">
											<BlockIcon icon={ icon && icon.src } />
										</span>
									) }
								>
									{ title }
								</IconButton>
							) ) }
						</PanelBody>

						{ ( hoveredClassName !== null ) &&
							<BlockPreview
								name={ blocks[ 0 ].name }
								attributes={ { ...blocks[ 0 ].attributes, className: hoveredClassName } }
							/>
						}
					</Fragment>
				) }
			/>
		);
	}
}

export default compose(
	withSelect( ( select, ownProps ) => {
		const { getBlock, getEditorSettings } = select( 'core/editor' );
		const { templateLock } = getEditorSettings();
		return {
			blocks: ownProps.uids.map( getBlock ),
			isLocked: !! templateLock,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => ( {
		onTransform( blocks, name ) {
			dispatch( 'core/editor' ).replaceBlocks(
				ownProps.uids,
				switchToBlockType( blocks, name )
			);
		},
	} ) ),
)( BlockSwitcher );
