/**
 * WordPress dependencies
 */
import { ToggleControl, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useUnsupportedBlocks } from '../../utils';

export default function EnhancedPaginationControl( {
	enhancedPagination,
	setAttributes,
	clientId,
} ) {
	const { hasBlocksFromPlugins, hasPostContentBlock } =
		useUnsupportedBlocks( clientId );

	const help = enhancedPagination ? (
		<>
			{ __(
				'Browsing between pages will be seamless unless unexpected content is detected.'
			) }{ ' ' }
			<ExternalLink href="https://wordpress.org/">
				{ __( 'Learn more' ) }
			</ExternalLink>
			{ '.' }
		</>
	) : (
		__( 'Browsing between pages requires a full page reload.' )
	);

	return (
		<>
			<ToggleControl
				label={ __( 'Force page reload' ) }
				help={ help }
				checked={ ! enhancedPagination }
				disabled={ hasBlocksFromPlugins || hasPostContentBlock }
				onChange={ ( value ) => {
					setAttributes( {
						enhancedPagination: ! value,
					} );
				} }
			/>
		</>
	);
}
