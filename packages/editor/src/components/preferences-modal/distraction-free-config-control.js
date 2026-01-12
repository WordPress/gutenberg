/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { ToggleControl } from '@wordpress/components';

/**
 * A component for toggling values within the distractionFreeConfig object.
 *
 * @param {Object} props           Component props.
 * @param {string} props.configKey The key within distractionFreeConfig to toggle.
 * @param {string} props.label     The label for the toggle control.
 * @param {string} props.help      Help text for the toggle control.
 */
export default function DistractionFreeConfigControl( {
	configKey,
	label,
	help,
} ) {
	const isChecked = useSelect(
		( select ) => {
			const config =
				select( preferencesStore ).get(
					'core',
					'distractionFreeConfig'
				) || {};
			return !! config[ configKey ];
		},
		[ configKey ]
	);

	const { set } = useDispatch( preferencesStore );

	const onChange = () => {
		const config =
			window.wp.data
				.select( preferencesStore )
				.get( 'core', 'distractionFreeConfig' ) || {};
		set( 'core', 'distractionFreeConfig', {
			...config,
			[ configKey ]: ! config[ configKey ],
		} );
	};

	return (
		<div className="preference-base-option">
			<ToggleControl
				label={ label }
				help={ help }
				checked={ isChecked }
				onChange={ onChange }
			/>
		</div>
	);
}
