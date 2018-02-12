/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, IconButton, withContext } from '@wordpress/components';
import { createBlock, isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { Component, compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import { getBlockInsertionPoint, getSelectedBlock } from '../../store/selectors';
import {
	insertBlock,
	hideInsertionPoint,
	showInsertionPoint,
	replaceBlocks,
} from '../../store/actions';

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
			children,
			onInsertBlock,
			insertionPoint,
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
						onInsertBlock( item, insertionPoint );

						onClose();
					};

					return <InserterMenu onSelect={ onSelect } />;
				} }
			/>
		);
	}
}

export default compose( [
	connect(
		( state, ownProps ) => {
			return {
				insertionPoint: getBlockInsertionPoint( state, ownProps.rootUID ),
				selectedBlock: getSelectedBlock( state ),
			};
		},
		{
			showInsertionPoint,
			hideInsertionPoint,
			insertBlock,
			replaceBlocks,
		},
		( { selectedBlock, ...stateProps }, dispatchProps, { layout, rootUID, ...ownProps } ) => ( {
			...stateProps,
			...ownProps,
			showInsertionPoint: dispatchProps.showInsertionPoint,
			hideInsertionPoint: dispatchProps.hideInsertionPoint,
			onInsertBlock( item, index ) {
				const { name, initialAttributes } = item;
				const insertedBlock = createBlock( name, { ...initialAttributes, layout } );
				if ( selectedBlock && isUnmodifiedDefaultBlock( selectedBlock ) ) {
					dispatchProps.replaceBlocks( selectedBlock.uid, insertedBlock );
					return;
				}
				dispatchProps.insertBlock( insertedBlock, index, rootUID );
			},
		} )
	),
	withContext( 'editor' )( ( settings ) => {
		const { blockTypes, templateLock } = settings;

		return {
			hasSupportedBlocks: true === blockTypes || ! isEmpty( blockTypes ),
			isLocked: !! templateLock,
		};
	} ),
] )( Inserter );
