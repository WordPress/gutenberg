/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';

/**
 * Component for managing List View dynamic expansion preferences.
 *
 * @return {Element} The preferences panel component.
 */
export default function ListViewDynamicExpansionSettings() {
	const { set } = useDispatch( preferencesStore );

	const maxVisibleBlocks = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		return get( 'core/edit-post', 'dynamicListViewMaxBlocks' ) ?? 20;
	}, [] );

	return (
		<div className="preference-base-option">
			<NumberControl
				__next40pxDefaultSize
				label={ __( 'Maximum auto-expanded blocks' ) }
				help={ __(
					'The List View will automatically collapse deeper levels to keep the visible block count at or below this number.'
				) }
				value={ maxVisibleBlocks }
				onChange={ ( value ) => {
					const numValue = parseInt( value, 10 );
					if ( ! isNaN( numValue ) && numValue >= 5 ) {
						set(
							'core/edit-post',
							'dynamicListViewMaxBlocks',
							numValue
						);
					}
				} }
				min={ 5 }
				max={ 200 }
			/>
		</div>
	);
}
