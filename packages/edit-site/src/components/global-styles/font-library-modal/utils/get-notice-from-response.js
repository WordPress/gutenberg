/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export function getNoticeFromInstallResponse( response ) {
	const { errors = [], successes = [] } = response;
	// Everything failed.
	if ( errors.length && ! successes.length ) {
		return {
			type: 'error',
			message: __( 'Error installing the fonts.' ),
		};
	}

	// Eveerything succeeded.
	if ( ! errors.length && successes.length ) {
		return {
			type: 'success',
			message: __( 'Fonts were installed successfully.' ),
		};
	}

	// Some succeeded, some failed.
	if ( errors.length && successes.length ) {
		return {
			type: 'warning',
			message: __(
				'Some fonts were installed successfully and some failed.'
			),
		};
	}
}

export function getNoticeFromUninstallResponse( response ) {
	const { errors = [], successes = [] } = response;
	// Everything failed.
	if ( errors.length && ! successes.length ) {
		return {
			type: 'error',
			message: __( 'Error uninstalling the fonts.' ),
		};
	}

	// Everything succeeded.
	if ( ! errors.length && successes.length ) {
		return {
			type: 'success',
			message: __( 'Fonts were uninstalled successfully.' ),
		};
	}

	// Some succeeded, some failed.
	if ( errors.length && successes.length ) {
		return {
			type: 'warning',
			message: __(
				'Some fonts were uninstalled successfully and some failed.'
			),
		};
	}
}
