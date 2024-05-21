/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { store as preferencesStore } from '@wordpress/preferences';

export function UnforwardedPreferencesAwareButton( props, ref ) {
	const { showIconLabels } = useSelect( ( select ) => {
		const { get } = select( preferencesStore );

		return {
			showIconLabels: get( 'core', 'showIconLabels' ),
		};
	}, [] );

	const { icon, label, text, className, ...restProps } = props;

	return (
		<Button
			icon={ showIconLabels ? null : icon }
			label={ label }
			text={ showIconLabels ? label : text }
			ref={ ref }
			className={ clsx( 'preferences-aware-button', className, {
				'is-showing-icon-label': showIconLabels,
			} ) }
			{ ...restProps }
		/>
	);
}

export const PreferencesAwareButton = forwardRef(
	UnforwardedPreferencesAwareButton
);
export default PreferencesAwareButton;
