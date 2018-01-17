/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { isEmpty, over } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, IconButton, withContext } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import { getBlockInsertionPoint, getEditorMode } from '../../store/selectors';
import { insertBlock, toggleInsertionPointVisible } from '../../store/actions';

/**
 * Component to render a block inserter.
 *
 * @param {Object} props Component props.
 *
 * @returns {void}
 */
function Inserter( props ) {
	const {
		position,
		children,
		onInsertBlock,
		insertionPoint,
		hasSupportedBlocks,
		isLocked,
	} = props;

	if ( ! hasSupportedBlocks || isLocked ) {
		return null;
	}

	return (
		<Dropdown
			className="editor-inserter"
			position={ position }
			onToggle={ props.onToggle }
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
					onInsertBlock(
						name,
						initialAttributes,
						insertionPoint
					);

					onClose();
				};

				return <InserterMenu onSelect={ onInsert } />;
			} }
		/>
	);
}

export default compose( [
	connect(
		( state ) => {
			return {
				insertionPoint: getBlockInsertionPoint( state ),
				mode: getEditorMode( state ),
			};
		},
		( dispatch, ownProps ) => ( {
			onInsertBlock( name, initialAttributes, position ) {
				dispatch( insertBlock(
					createBlock( name, initialAttributes ),
					position
				) );
			},

			onToggle: over( [
				// Allow parent component to handle toggle, e.g. setting an
				// insertion point prior to it being shown
				ownProps.onToggle,

				// Toggle insertion point visibility to new value
				( isOpen ) => dispatch( toggleInsertionPointVisible( isOpen ) ),
			] ),
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
