/**
 * WordPress dependencies
 */
import { ToggleControl, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import { speak } from '@wordpress/a11y';

export default function EnhancedPaginationControl( {
	enhancedPagination,
	setAttributes,
} ) {
	const enhancedPaginationNotice = __(
		'Enhanced Pagination might cause interactive blocks within the Post Template to stop working. Disable it if you experience any issues.'
	);

	const isFirstRender = useRef( true ); // Don't speak on first render.
	useEffect( () => {
		if ( ! isFirstRender.current && enhancedPagination ) {
			speak( enhancedPaginationNotice );
		}
		isFirstRender.current = false;
	}, [ enhancedPagination, enhancedPaginationNotice ] );

	return (
		<>
			<ToggleControl
				label={ __( 'Enhanced pagination' ) }
				help={ __(
					'Browsing between pages won’t require a full page reload.'
				) }
				checked={ !! enhancedPagination }
				onChange={ ( value ) => {
					setAttributes( {
						enhancedPagination: !! value,
					} );
				} }
			/>
			{ enhancedPagination && (
				<div>
					<Notice
						spokenMessage={ null }
						status="warning"
						isDismissible={ false }
					>
						{ enhancedPaginationNotice }
					</Notice>
				</div>
			) }
		</>
	);
}
