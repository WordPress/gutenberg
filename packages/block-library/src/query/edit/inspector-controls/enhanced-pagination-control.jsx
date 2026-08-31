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
		help =
			unsupportedBlocks.length === 1
				? sprintf(
						/* translators: %s: The title of the block that isn't supported. */
						__(
							`Enhancement disabled because this block isn't supported: %s. Remove it to change this setting.`
						),
						unsupportedBlocks[ 0 ]
				  )
				: sprintf(
						/* translators: %s: A comma-separated list of block titles. */
						__(
							`Enhancement disabled because these blocks aren't supported: %s. Remove them to change this setting.`
						),
						unsupportedBlocks.join( ', ' )
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
