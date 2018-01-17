/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, IconButton, withContext } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { Component, compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import { getEditorMode } from '../../store/selectors';
import {
	insertBlock,
	hideInsertionPoint,
	showInsertionPoint,
} from '../../store/actions';

class Inserter extends Component {
	constructor() {
		super( ...arguments );

		this.onToggle = this.onToggle.bind( this );
	}

	onToggle( isOpen ) {
		const {
			insertIndex,
			onToggle,
		} = this.props;

		if ( isOpen ) {
			this.props.showInsertionPoint( insertIndex );
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
					const onInsert = ( name, initialAttributes ) => {
						const { onInsertBlock } = this.props;
						onInsertBlock( name, initialAttributes );
						onClose();
					};

					return <InserterMenu onSelect={ onInsert } />;
				} }
			/>
		);
	}
}

export default compose( [
	connect(
		( state ) => {
			return {
				mode: getEditorMode( state ),
			};
		},
		( dispatch, ownProps ) => ( {
			onInsertBlock( name, initialAttributes ) {
				const { insertIndex } = ownProps;

				dispatch( insertBlock(
					createBlock( name, initialAttributes ),
					insertIndex
				) );
			},
			...bindActionCreators( {
				showInsertionPoint,
				hideInsertionPoint,
			}, dispatch ),
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
