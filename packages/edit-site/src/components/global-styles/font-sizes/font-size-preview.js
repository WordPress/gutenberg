/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
const { useGlobalStyle } = unlock( blockEditorPrivateApis );

function FontSizePreview( { fontSize } ) {
	const [ font ] = useGlobalStyle( 'typography' );
	return (
		<div
			className="edit-site-typography-preview"
			style={ {
				fontSize: fontSize.size,
				fontFamily: font?.fontFamily ?? 'serif',
			} }
		>
			{ __( 'Aa' ) }
		</div>
	);
}

export default FontSizePreview;
