/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, IconButton } from '@wordpress/components';
import { createBlock, isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';

class Inserter extends Component {
	constructor() {
		super( ...arguments );

		this.onToggle = this.onToggle.bind( this );
	}

	onToggle( isOpen ) {
		const { onToggle } = this.props;

		if ( isOpen ) {
			this.props.showInsertionPoint();
		} else {
			this.props.hideInsertionPoint();
		}

		// Surface toggle callback to parent component
		if ( onToggle ) {
			onToggle( isOpen );
		}
	}

	render() {
		const {
			position,
			title,
			children,
			onInsertBlock,
			hasSupportedBlocks,
			isLocked,
		} = this.props;

		if ( ! hasSupportedBlocks || isLocked ) {
			return null;
		}

		return (
			<Dropdown
				className="editor-inserter"
				position={ position }
				onToggle={ this.onToggle }
				expandOnMobile
				headerTitle={ title }
				renderToggle={ ( { onToggle, isOpen } ) => (
					<IconButton
						icon="insert"
						label={ __( 'Add block' ) }
						onClick={ onToggle }
						className="editor-inserter__toggle"
						aria-haspopup="true"
						aria-expanded={ isOpen }
					>
						{ children }
					</IconButton>
				) }
				renderContent={ ( { onClose } ) => {
					const onSelect = ( item ) => {
						onInsertBlock( item );

						onClose();
					};

					return <InserterMenu onSelect={ onSelect } />;
				} }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getEditedPostAttribute,
			getBlockInsertionPoint,
			getSelectedBlock,
			getSupportedBlocks,
			getEditorSettings,
		} = select( 'core/editor' );
		const { allowedBlockTypes, templateLock } = getEditorSettings();
		const insertionPoint = getBlockInsertionPoint();
		const {
			rootUID: insertionPointRootUID,
			index: insertionPointIndex,
			layout: insertionPointLayout,
		} = insertionPoint;
		const supportedBlocks = getSupportedBlocks( insertionPointRootUID, allowedBlockTypes );
		const selectedBlock = getSelectedBlock();
		const selectedBlockUid = selectedBlock && selectedBlock.uid;
		const blockIsUnmodifiedDefaultBlock = selectedBlock && isUnmodifiedDefaultBlock( selectedBlock );
		return {
			title: getEditedPostAttribute( 'title' ),
			hasSupportedBlocks: true === supportedBlocks || ! isEmpty( supportedBlocks ),
			isLocked: !! templateLock,
			selectedBlockUid,
			blockIsUnmodifiedDefaultBlock,
			insertionPointRootUID,
			insertionPointIndex,
			insertionPointLayout,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => ( {
		showInsertionPoint: dispatch( 'core/editor' ).showInsertionPoint,
		hideInsertionPoint: dispatch( 'core/editor' ).hideInsertionPoint,
		onInsertBlock: ( item ) => {
			const { selectedBlockUid, blockIsUnmodifiedDefaultBlock, insertionPointIndex, insertionPointLayout, insertionPointRootUID } = ownProps;
			const { name, initialAttributes } = item;
			const insertedBlock = createBlock( name, { ...initialAttributes, layout: insertionPointLayout } );
			if ( blockIsUnmodifiedDefaultBlock ) {
				return dispatch( 'core/editor' ).replaceBlocks( selectedBlockUid, insertedBlock );
			}
			return dispatch( 'core/editor' ).insertBlock( insertedBlock, insertionPointIndex, insertionPointRootUID );
		},
	} ) ),
] )( Inserter );
