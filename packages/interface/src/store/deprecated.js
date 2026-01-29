/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

export function normalizeComplementaryAreaScope( scope ) {
	if ( [ 'core/edit-post', 'core/edit-site' ].includes( scope ) ) {
		deprecated( `${ scope } interface scope`, {
			alternative: 'core interface scope',
			hint: 'core/edit-post and core/edit-site are merging.',
			version: '6.6',
		} );
		return 'core';
	}

	return scope;
}

export function normalizeComplementaryAreaName( scope, name ) {
	if ( scope === 'core' && name === 'edit-site/template' ) {
		deprecated( `edit-site/template sidebar`, {
			alternative: 'edit-post/document',
			version: '6.6',
		} );
		return 'edit-post/document';
	}

	if ( scope === 'core' && name === 'edit-site/block-inspector' ) {
		deprecated( `edit-site/block-inspector sidebar`, {
			alternative: 'edit-post/block',
			version: '6.6',
		} );
		return 'edit-post/block';
	}

	return name;
}
