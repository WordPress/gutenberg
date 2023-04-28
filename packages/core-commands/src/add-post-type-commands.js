/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/commands';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useMemo } from '@wordpress/element';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const { useCommandLoader } = unlock( privateApis );

const getAddPostTypeCommandLoader = ( postType ) =>
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

		const commands = useMemo(
			() => [
				{
					name: 'core/wp-admin/add-' + postType + '-' + search,
					label,
					icon: plus,
					callback: () => {
						document.location.href = addQueryArgs( 'post-new.php', {
							post_type: postType,
							post_title: hasRecordTitle ? search : undefined,
						} );
					},
				},
			],
			[ hasRecordTitle, search, label ]
		);

		return {
			isLoading: false,
			commands,
		};
	};

const useAddPostLoader = getAddPostTypeCommandLoader( 'post' );
const useAddPageLoader = getAddPostTypeCommandLoader( 'page' );

export function useAddPostTypeCommands() {
	useCommandLoader( {
		name: 'core/wp-admin/add-post-loader',
		hook: useAddPostLoader,
	} );
	useCommandLoader( {
		name: 'core/wp-admin/add-page-loader',
		hook: useAddPageLoader,
	} );
}
