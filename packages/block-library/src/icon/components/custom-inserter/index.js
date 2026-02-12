/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Modal, SearchControl } from '@wordpress/components';
import { useState, useMemo, useCallback } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import IconGrid from './icon-grid';
import { normalizeSearchInput } from '../../../utils/search-patterns';

export default function CustomInserterModal( {
	icons,
	setInserterOpen,
	attributes,
	setAttributes,
} ) {
	const [ searchInput, setSearchInput ] = useState( '' );

	const debouncedSetSearchInput = useDebounce( setSearchInput, 300 );

	const setIcon = useCallback(
		( name ) => {
			setAttributes( {
				icon: name,
			} );
			setInserterOpen( false );
		},
		[ setAttributes, setInserterOpen ]
	);

	const filteredIcons = useMemo( () => {
		if ( searchInput ) {
			const input = normalizeSearchInput( searchInput );
			return icons.filter( ( icon ) => {
				const iconName = normalizeSearchInput( icon.name );
				const iconLabel = normalizeSearchInput( icon.label );

				return (
					iconName.includes( input ) || iconLabel.includes( input )
				);
			} );
		}

		return icons;
	}, [ searchInput, icons ] );

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
						onChange={ debouncedSetSearchInput }
					/>
				</div>
				<IconGrid
					icons={ filteredIcons }
					onChange={ setIcon }
					attributes={ attributes }
				/>
			</div>
		</Modal>
	);
}
