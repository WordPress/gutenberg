/**
 * WordPress dependencies
 */
import {
	useEntityProp,
	__experimentalUseEntitySaving,
} from '@wordpress/core-data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { PlainText } from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { ENTER } from '@wordpress/keycodes';

function SiteTitleEdit( { insertDefaultBlock } ) {
	const [ title, setTitle ] = useEntityProp( 'root', 'site', 'title' );
	const [ isDirty, isSaving, save ] = __experimentalUseEntitySaving(
		'root',
		'site',
		'title'
	);

	const preventNewlines = ( event ) => {
		if ( event.keyCode === ENTER ) {
			event.preventDefault();
			insertDefaultBlock();
		}
	};

	return (
		<>
			<Button
				isPrimary
				className="wp-block-site-title__save-button"
				disabled={ ! isDirty || ! title }
				isBusy={ isSaving }
				onClick={ save }
			>
				{ __( 'Update' ) }
			</Button>
			<PlainText
				placeholder={ __( 'Site Title' ) }
				value={ title }
				onChange={ setTitle }
				isSingleLine
				isStylable
				onKeyDown={ preventNewlines }
			/>
		</>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlockIndex, getBlockRootClientId } = select( 'core/block-editor' );
		const rootClientId = getBlockRootClientId( clientId );

		return {
			blockIndex: getBlockIndex( clientId, rootClientId ),
			rootClientId,
		};
	} ),
	withDispatch( ( dispatch, { blockIndex, rootClientId } ) => ( {
		insertDefaultBlock: () =>
			dispatch( 'core/block-editor' ).insertDefaultBlock( {}, rootClientId, blockIndex + 1 ),
	} ) ),
] )( SiteTitleEdit );
