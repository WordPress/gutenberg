/**
 * WordPress dependencies
 */
import {
	__experimentalFetchLinkSuggestions as fetchLinkSuggestions,
	store as coreStore,
} from '@wordpress/core-data';
import { Button, ComboboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, createInterpolateElement } from '@wordpress/element';
import { debounce } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import type { DataFormControlProps } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
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
		setOptions( [] );
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
		const mappedSuggestions = results.map( ( result ) => {
			return {
				label: result.title,
				value: result.id.toString(),
			};
		} );
		setOptions( mappedSuggestions );
		setIsLoading( false );
	};

	/**
	 * Handle selection.
	 *
	 * @param {Object} selectedPostId The selected post id.
	 */
	const handleSelectOption = (
		selectedPostId: string | null | undefined
	) => {
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

	const help = !! data.post
		? createInterpolateElement(
				__(
					'Search for a post or page to attach this media to or <button>detach current</button>.'
				),
				{
					button: (
						<Button
							__next40pxDefaultSize
							onClick={ handleDetach }
							variant="link"
							accessibleWhenDisabled
						/>
					),
				}
		  )
		: __( 'Search for a post or page to attach this media to.' );

	return (
		<ComboboxControl
			className="dataviews-media-field__attached-to"
			__next40pxDefaultSize
			isLoading={ isLoading }
			label={ __( 'Attached to' ) }
			help={ help }
			value={ value }
			options={ options }
			onFilterValueChange={ debounce(
				( filterValue: unknown ) =>
					onValueChange( filterValue as string ),
				300
			) }
			onChange={ handleSelectOption }
			hideLabelFromVision
		/>
	);
}
