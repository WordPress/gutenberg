/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/commands';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../private-apis';

const { useCommandLoader } = unlock( privateApis );

const getWPAdminAddCommandLoader = ( postType ) =>
	function useAddCommandLoader( { search } ) {
		let label;
		if ( postType === 'post' ) {
			label = __( 'Add a new post' );
		} else if ( postType === 'page' ) {
			label = __( 'Add a new page' );
		} else {
			throw 'unsupported post type ' + postType;
		}
		const hasRecordTitle =
			!! search && ! label.toLowerCase().includes( search.toLowerCase() );
		if ( postType === 'post' && hasRecordTitle ) {
			/* translators: %s: Post title placeholder */
			label = sprintf( __( 'Add a new post "%s"' ), search );
		} else if ( postType === 'page' && hasRecordTitle ) {
			/* translators: %s: Page title placeholder */
			label = sprintf( __( 'Add a new page "%s"' ), search );
		}

		const newPostLink = useSelect( ( select ) => {
			const { getSettings } = unlock( select( editSiteStore ) );
			return getSettings().newPostLink ?? 'post-new.php';
		}, [] );

		const commands = useMemo(
			() => [
				{
					name: 'core/wp-admin/add-' + postType,
					label,
					callback: () => {
						document.location.href = addQueryArgs( newPostLink, {
							post_type: postType,
							post_title: hasRecordTitle ? search : undefined,
						} );
					},
				},
			],
			[ newPostLink, hasRecordTitle, search, label ]
		);

		return {
			isLoading: false,
			commands,
		};
	};

const useAddPostLoader = getWPAdminAddCommandLoader( 'post' );
const useAddPageLoader = getWPAdminAddCommandLoader( 'page' );

export function useWPAdminCommands() {
	useCommandLoader( {
		name: 'core/wp-admin/add-post-loader',
		hook: useAddPostLoader,
	} );
	useCommandLoader( {
		name: 'core/wp-admin/add-page-loader',
		hook: useAddPageLoader,
	} );
}
