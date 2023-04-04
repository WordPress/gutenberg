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

const getWPAdminCreateCommandLoader = ( postType ) =>
	function useCreateCommandLoader( { search } ) {
		let label;
		if ( postType === 'post' ) {
			label = __( 'Create a new post' );
		} else if ( postType === 'page' ) {
			label = __( 'Create a new page' );
		} else {
			throw 'unsupported post type ' + postType;
		}
		const hasRecordTitle =
			!! search && ! label.toLowerCase().includes( search.toLowerCase() );
		if ( postType === 'post' && hasRecordTitle ) {
			/* translators: %s: Post title placeholder */
			label = sprintf( __( 'Create a new post "%s"' ), search );
		} else if ( postType === 'page' && hasRecordTitle ) {
			/* translators: %s: Page title placeholder */
			label = sprintf( __( 'Create a new page "%s"' ), search );
		}

		const newPostLink = useSelect( ( select ) => {
			const { getSettings } = unlock( select( editSiteStore ) );
			return getSettings().newPostLink ?? 'post-new.php';
		}, [] );

		const commands = useMemo(
			() => [
				{
					name: 'core/wp-admin/create-' + postType,
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

const useCreatePostLoader = getWPAdminCreateCommandLoader( 'post' );
const useCreatePageLoader = getWPAdminCreateCommandLoader( 'page' );

export function useWPAdminCommands() {
	useCommandLoader( {
		name: 'core/wp-admin/create-post-loader',
		hook: useCreatePostLoader,
	} );
	useCommandLoader( {
		name: 'core/wp-admin/create-page-loader',
		hook: useCreatePageLoader,
	} );
}
