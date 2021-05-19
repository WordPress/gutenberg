/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

export default function WelcomeGuideMenuItem() {
	const isTemplateMode = useSelect(
		( select ) => select( editPostStore ).isEditingTemplate(),
		[]
	);
	const { toggleFeature } = useDispatch( editPostStore );

	return (
		<MenuItem
			onClick={ () =>
				toggleFeature(
					isTemplateMode ? 'welcomeGuideTemplate' : 'welcomeGuide'
				)
			}
		>
			{ __( 'Welcome Guide' ) }
		</MenuItem>
	);
}
