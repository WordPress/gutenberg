/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Modal, SearchControl } from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
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

	const debouncedSetSearchInput = useDebounce( setSearchInput, 300 );

	function updateIconAtts( name ) {
		setAttributes( {
			icon: name,
		} );
		setInserterOpen( false );
	}

	const filteredIcons = useMemo( () => {
		if ( searchInput ) {
			const input = searchInput.toLowerCase();
			return icons.filter( ( icon ) => {
				const iconName = icon.name.toLowerCase();
				const iconLabel = icon.label.toLowerCase();

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
					shownIcons={ filteredIcons }
					updateIconAtts={ updateIconAtts }
					attributes={ attributes }
				/>
			</div>
		</Modal>
	);
}
