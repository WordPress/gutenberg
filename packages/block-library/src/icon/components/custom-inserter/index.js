/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Modal } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ContentHeader from './content-header';
import IconGrid from './icon-grid';

export default function InserterModal( props ) {
	const { icons, setInserterOpen, attributes, setAttributes } = props;

	const [ searchInput, setSearchInput ] = useState( '' );

	function updateIconAtts( name ) {
		setAttributes( {
			icon: name,
		} );
		setInserterOpen( false );
	}

	// Move the filtering logic to a separate function
	const getFilteredIcons = useCallback( () => {
		if ( searchInput ) {
			return icons.filter( ( icon ) => {
				const input = searchInput.toLowerCase();
				const iconName = icon.name.toLowerCase();

				return iconName.includes( input );
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
				<div className="wp-block-icon__inserter-content">
					<ContentHeader
						searchInput={ searchInput }
						setSearchInput={ setSearchInput }
						shownIconsCount={ getFilteredIcons().length }
					/>
					<IconGrid
						shownIcons={ getFilteredIcons() }
						updateIconAtts={ updateIconAtts }
						attributes={ attributes }
					/>
				</div>
			</div>
		</Modal>
	);
}
