import { ToggleControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useUnsupportedBlocks } from '../../utils';

export default function EnhancedPaginationControl( {
	enhancedPagination,
	setAttributes,
	clientId,
} ) {
	const unsupportedBlocks = useUnsupportedBlocks( clientId );

	let help = __(
		'Reload the full page—instead of just the posts list—when visitors navigate between pages.'
	);
	if ( unsupportedBlocks.length ) {
		help = sprintf(
			/* translators: %s: A list of block titles. */
			__(
				`Some blocks aren't supported: %s. Remove them to change this setting.`
			),
			unsupportedBlocks.join(
				/* translators: Used between list items, there is a space after the comma. */
				__( ', ' ) // eslint-disable-line @wordpress/i18n-no-flanking-whitespace
			)
		);
	}

	return (
		<>
			<ToggleControl
				label={ __( 'Reload full page' ) }
				help={ help }
				checked={ ! enhancedPagination }
				disabled={ !! unsupportedBlocks.length }
				onChange={ ( value ) => {
					setAttributes( {
						enhancedPagination: ! value,
					} );
				} }
			/>
		</>
	);
}
