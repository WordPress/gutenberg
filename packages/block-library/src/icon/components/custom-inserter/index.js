/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Modal, SearchControl } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import IconGrid from './icon-grid';

export default function CustomInserterModal( {
	icons,
	setInserterOpen,
	attributes,
	setAttributes,
} ) {
	const [ searchInput, setSearchInput ] = useState( '' );

	// Debounce the search input with a 300ms delay
	const debouncedSearchInput = useDebounce( searchInput, 300 );

	function updateIconAtts( name ) {
		setAttributes( {
			icon: name,
		} );
		setInserterOpen( false );
	}

	// Move the filtering logic to a separate function
	const getFilteredIcons = useCallback( () => {
		if (
			debouncedSearchInput &&
			typeof debouncedSearchInput === 'string'
		) {
			return icons.filter( ( icon ) => {
				const input = debouncedSearchInput.toLowerCase();
				const iconName = icon.name.toLowerCase();

				return iconName.includes( input );
			} );
		}

		return icons;
	}, [ debouncedSearchInput, icons ] );

	return (
		<Modal
			className="wp-block-icon__inserter-modal"
			title={ __( 'Icon library' ) }
			onRequestClose={ () => setInserterOpen( false ) }
			isFullScreen
		>
			<div className="wp-block-icon__inserter">
				<div className="wp-block-icon__inserter-header">
					<SearchControl
						value={ searchInput }
						onChange={ setSearchInput }
					/>
				</div>
				<IconGrid
					shownIcons={ getFilteredIcons() }
					updateIconAtts={ updateIconAtts }
					attributes={ attributes }
				/>
			</div>
		</Modal>
	);
}
