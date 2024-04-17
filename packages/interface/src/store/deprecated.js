/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

export function normalizeComplementaryAreaScope( scope ) {
	if ( [ 'core/edit-post', 'core/edit-site' ].includes( scope ) ) {
		deprecated( `${ scope } interface scope`, {
			alternative:
				'Use the core/editor interface scope instead. core/edit-post and core/edit-site are merging.',
			version: '6.6',
		} );
		return 'core/editor';
	}

	return scope;
}
