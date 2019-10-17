/**
 * External dependencies
 */
import {
	get,
} from 'lodash';
/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { Dropdown, IconButton } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, ifCondition } from '@wordpress/compose';
import {
	createBlock,
	getBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';

const defaultRenderToggle = ( { onToggle, disabled, isOpen, blockTitle } ) => {
	let label = sprintf( _x( 'Add %s', 'directly add the allowed block' ), blockTitle );
	if ( blockTitle === '' ) {
		label = 'Add block';
	}
	return (
		<IconButton
			icon="insert"
			label={ label }
			labelPosition="bottom"
			onClick={ onToggle }
			className="editor-inserter__toggle block-editor-inserter__toggle"
			aria-haspopup="true"
			aria-expanded={ isOpen }
			disabled={ disabled }
		/>
	);
};

class Inserter extends Component {
	constructor() {
		super( ...arguments );

		this.onToggle = this.onToggle.bind( this );
		this.renderToggle = this.renderToggle.bind( this );
		this.renderContent = this.renderContent.bind( this );
	}

	onToggle( isOpen ) {
		const { onToggle } = this.props;

		// Surface toggle callback to parent component
		if ( onToggle ) {
			onToggle( isOpen );
		}
	}

	/**
	 * Render callback to display Dropdown toggle element.
	 *
	 * @param {Object}   options
	 * @param {Function} options.onToggle Callback to invoke when toggle is
	 *                                    pressed.
	 * @param {boolean}  options.isOpen   Whether dropdown is currently open.
	 *
	 * @return {WPElement} Dropdown toggle element.
	 */
	renderToggle( { onToggle, isOpen } ) {
		const {
			disabled,
			hasOnlyOneAllowedInserterItem,
			blockTitle,
			insertTheOnlyAllowedItem,
			renderToggle = defaultRenderToggle,
		} = this.props;

		if ( hasOnlyOneAllowedInserterItem ) {
			onToggle = insertTheOnlyAllowedItem;
		}

		return renderToggle( { onToggle, isOpen, disabled, blockTitle } );
	}

	/**
	 * Render callback to display Dropdown content element.
	 *
	 * @param {Object}   options
	 * @param {Function} options.onClose Callback to invoke when dropdown is
	 *                                   closed.
	 *
	 * @return {WPElement} Dropdown content element.
	 */
	renderContent( { onClose } ) {
		const { rootClientId, clientId, isAppender, showInserterHelpPanel } = this.props;

		return (
			<InserterMenu
				onSelect={ onClose }
				rootClientId={ rootClientId }
				clientId={ clientId }
				isAppender={ isAppender }
				showInserterHelpPanel={ showInserterHelpPanel }
			/>
		);
	}

	render() {
		const { position } = this.props;
		const toggle = this.renderToggle;

		return (
			<Dropdown
				className="editor-inserter block-editor-inserter"
				contentClassName="editor-inserter__popover block-editor-inserter__popover"
				position={ position }
				onToggle={ this.onToggle }
				expandOnMobile
				headerTitle={ __( 'Add a block' ) }
				renderToggle={ toggle }
				renderContent={ this.renderContent }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select, { rootClientId } ) => {
		const { hasInserterItems, hasOnlyOneAllowedInserterItem, getTheOnlyAllowedItem } = select( 'core/block-editor' );
		const allowedBlock = getBlockType( getTheOnlyAllowedItem( rootClientId ) );
		return {
			hasItems: hasInserterItems( rootClientId ),
			hasOnlyOneAllowedInserterItem: hasOnlyOneAllowedInserterItem( rootClientId ),
			blockTitle: allowedBlock ? allowedBlock.title : '',
		};
	} ),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		return {
			insertTheOnlyAllowedItem: () => {
				const { rootClientId, clientId, destinationRootClientId, isAppender } = ownProps;
				const {
					getBlockListSettings,
				} = select( 'core/block-editor' );
				const parentBlockListSettings = getBlockListSettings( rootClientId );
				const isOnlyOneAllowedBlock = get( parentBlockListSettings, [ 'allowedBlocks', 'length' ], 0 ) === 1;

				if ( ! isOnlyOneAllowedBlock ) {
					return false;
				}

				const parentAllowedBlocks = get( parentBlockListSettings, [ 'allowedBlocks' ] );

				const {
					getInsertionIndex,
				} = select( 'core/block-editor' );

				const {
					insertBlock,
				} = dispatch( 'core/block-editor' );
				const insertedBlock = createBlock( parentAllowedBlocks[ 0 ] );
				insertBlock(
					insertedBlock,
					getInsertionIndex( clientId, destinationRootClientId, isAppender ),
					rootClientId
				);
			},
		};
	} ),
	ifCondition( ( { hasItems } ) => hasItems ),
] )( Inserter );
