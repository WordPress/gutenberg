/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { uniq, keys, flatten } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Slot } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getSelectedBlock, getSelectedBlockCount, getMultiSelectedBlocks } from '../../selectors';

const BlockInspector = ( { selectedBlock, count, multiSelectedBlocks, onChange } ) => {
	if ( count > 1 ) {
		const names = uniq( multiSelectedBlocks.map( ( { name } ) => name ) );

		if ( names.length === 1 ) {
			const Inspector = getBlockType( names[ 0 ] ).inspector;

			if ( ! Inspector ) {
				return null;
			}

			const attributeArray = multiSelectedBlocks.map( ( block ) => block.attributes );
			const attributeKeys = uniq( flatten( attributeArray.map( keys ) ) );
			const attributes = attributeKeys.reduce( ( acc, key ) => {
				acc[ key ] = attributeArray.reduce( ( accu, attrs ) => {
					return accu === attrs[ key ] ? accu : undefined;
				}, attributeArray[ 0 ][ key ] );
				return acc;
			}, {} );

			const setAttributes = ( attrs ) => {
				multiSelectedBlocks.forEach( ( block ) => {
					onChange( block.uid, {
						...block.attributes,
						...attrs,
					} );
				} );
			};

			return (
				<Inspector
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			);
		}

		return <span className="editor-block-inspector__multi-blocks">{ __( 'Various blocks' ) }</span>;
	}

	if ( ! selectedBlock ) {
		return <span className="editor-block-inspector__no-blocks">{ __( 'No block selected.' ) }</span>;
	}

	const Inspector = getBlockType( selectedBlock.name ).inspector;

	if ( Inspector ) {
		return (
			<Inspector
				attributes={ selectedBlock.attributes }
				setAttributes={ ( attrs ) => onChange( selectedBlock.uid, attrs ) }
			/>
		);
	}

	return (
		<Slot name="Inspector.Controls" />
	);
};

export default connect(
	( state ) => {
		return {
			selectedBlock: getSelectedBlock( state ),
			count: getSelectedBlockCount( state ),
			multiSelectedBlocks: getMultiSelectedBlocks( state ),
		};
	},
	( dispatch ) => ( {
		onChange( uid, attributes ) {
			dispatch( {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				uid,
				attributes,
			} );
		},
	} ),
)( BlockInspector );
