import {
	__experimentalFetchLinkSuggestions as fetchLinkSuggestions,
	store as coreStore,
} from '@wordpress/core-data';
import { ComboboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDebounce, useEvent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import type { DataFormControlProps } from '@wordpress/dataviews';
import type { MediaItem } from '../types';
import { getRenderedContent } from '../utils/get-rendered-content';

export type SearchResult = {
	/**
	 * Post or term id.
	 */
	id: number;
	/**
	 * Link url.
	 */
	url: string;
	/**
	 * Title of the link.
	 */
	title: string;
	/**
	 * The taxonomy or post type slug or type URL.
	 */
	type: string;
	/**
	 * Link kind of post-type or taxonomy
	 */
	kind?: string;
};

export default function MediaAttachedToEdit( {
	data,
	onChange,
}: DataFormControlProps< MediaItem > ) {
	const defaultPost =
		!! data.post && !! data?._embedded?.[ 'wp:attached-to' ]?.[ 0 ]
			? [
					{
						label: getRenderedContent(
							data._embedded?.[ 'wp:attached-to' ]?.[ 0 ]?.title
						),
						value: data.post.toString(),
					},
			  ]
			: [];
	const [ options, setOptions ] =
		useState< { label: string; value: string }[] >( defaultPost );
	const [ searchResults, setSearchResults ] = useState< SearchResult[] >(
		[]
	);
	const [ isLoading, setIsLoading ] = useState( false );
	const [ value, setValue ] = useState< string | null >(
		data?.post?.toString() ?? null
	);

	const postTypes = useSelect(
		( select ) => select( coreStore ).getPostTypes(),
		[]
	);
	const handleDetach = () => {
		onChange( {
			post: 0,
			_embedded: { ...data?._embedded, 'wp:attached-to': undefined },
		} );
		setValue( null );
	};

	const onValueChange = async ( filterValue: string ) => {
		setIsLoading( true );
		const results = await fetchLinkSuggestions(
			filterValue,
			/*
			 * @TODO `fetchLinkSuggestions()` should accept `perPage` as an option argument.
			 * `isInitialSuggestions` limits the result to 3, otherwise it's hardcoded to 20.
			 */
			{ type: 'post', isInitialSuggestions: true },
			{}
		);
		setSearchResults( results );
		const suggestions = results.map( ( result ) => {
			return {
				label: result.title,
				value: result.id.toString(),
			};
		} );
		const includeCurrent =
			! filterValue &&
			suggestions.findIndex( ( s ) => s.value === value ) === -1;
		setOptions( suggestions.concat( includeCurrent ? defaultPost : [] ) );
		setIsLoading( false );
	};

	// `onValueChange` closes over state, so it's wrapped in `useEvent` to give
	// `useDebounce` a stable function. Debouncing an inline function instead
	// rebuilds the timer on every render, so nothing is debounced and each
	// keystroke fires its own request.
	const debouncedValueChange = useDebounce( useEvent( onValueChange ), 300 );

	/**
	 * Handle selection.
	 *
	 * @param {Object} selectedPostId The selected post id.
	 */
	const handleSelectOption = ( selectedPostId: string | null ) => {
		if ( ! selectedPostId ) {
			handleDetach();
			return;
		}
		setValue( selectedPostId );
		if ( selectedPostId ) {
			const selectedPost = searchResults.find(
				( result ) => result.id === Number( selectedPostId )
			);
			// Although unlikely, it's technically possible for selectedPost to not be found.
			// E.g. if the user selects an option just as new search results are loaded.
			// TODO: Add error handling for when selectedPost is not found.
			if ( selectedPost && postTypes ) {
				const postType = postTypes.find(
					( _postType: { slug: string } ) =>
						_postType.slug === selectedPost?.type
				);

				const attachedTo = {
					...( postType && { type: postType.slug } ),
					id: Number( selectedPostId ),
					title: {
						raw: selectedPost.title,
						rendered: selectedPost.title,
					},
				};

				onChange( {
					post: Number( selectedPostId ),
					_embedded: {
						...data?._embedded,
						'wp:attached-to': [ attachedTo ],
					},
				} );
			}
		}
	};

	return (
		<ComboboxControl
			className="dataviews-media-field__attached-to"
			isLoading={ isLoading }
			label={ __( 'Attached to' ) }
			help={ __( 'Attach this file to a single post or page.' ) }
			value={ value }
			options={ options }
			onFilterValueChange={ ( filterValue: unknown ) =>
				debouncedValueChange( filterValue as string )
			}
			onChange={ handleSelectOption }
			hideLabelFromVision
			// Opening the panel shouldn't imply the user has decided to change
			// the attachment, so wait for them to search before showing the list.
			expandOnFocus={ false }
		/>
	);
}
