/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

document.addEventListener( 'DOMContentLoaded', function () {
	const likedPostsElement = document.getElementById( 'liked-posts' );

	// Get liked posts from localStorage for logged-out users.
	const likedPosts = ( () => {
		try {
			return (
				JSON.parse( window.localStorage.getItem( 'likedPosts' ) ) || []
			);
		} catch ( e ) {
			likedPostsElement.innerHTML =
				'<p>' + __( "Couldn't fetch posts." ) + '</p>';
			return undefined;
		}
	} )();

	if ( likedPosts === undefined ) {
		// Exit if localStorage access failed.
		return;
	}
	if ( likedPosts.length === 0 ) {
		likedPostsElement.innerHTML =
			'<p>' + __( 'No liked posts found.' ) + '</p>';
		return;
	}

	const postsPerPage = 10;
	const urlParams = new URLSearchParams( window.location.search );
	const currentPage = parseInt( urlParams.get( 'paged' ) ) || 1;
	const totalPages = Math.ceil( likedPosts.length / postsPerPage );

	// Slice liked posts for current page.
	const paginatedPosts = likedPosts.slice(
		( currentPage - 1 ) * postsPerPage,
		currentPage * postsPerPage
	);

	// Fetch post data from WordPress REST API.
	fetch( `/wp-json/wp/v2/search?include=${ paginatedPosts.join( ',' ) }` )
		.then( ( response ) => response.json() )
		.then( ( posts ) => {
			let output = '';
			posts.forEach( ( post ) => {
				output += `<li><h2><a href="${ post.url }">${ post.title }</a></h2></li>`;
			} );

			likedPostsElement.innerHTML = output;

			// Add pagination.
			likedPostsElement.insertAdjacentHTML(
				'afterend',
				generatePagination( currentPage, totalPages )
			);
		} )
		.catch( () => {
			likedPostsElement.innerHTML =
				'<p>' + __( "Couldn't fetch posts." ) + '</p>';
		} );

	// Function to generate pagination links
	function generatePagination( current, total ) {
		if ( total <= 1 ) {
			return ''; // No need for pagination if only one page.
		}

		let paginationHTML = '<div class="pagination">';
		if ( current > 1 ) {
			paginationHTML += `<a href="?paged=${
				current - 1
			}" class="prev page-numbers">« Previous</a>`;
		}
		for ( let i = 1; i <= total; i++ ) {
			paginationHTML += ' ';
			if ( i === current ) {
				paginationHTML += `<span aria-current="page" class="page-numbers current">${ i }</span>`;
			} else {
				paginationHTML += `<a href="?paged=${ i }" class="page-numbers"">${ i }</a>`;
			}
		}
		if ( current < total ) {
			paginationHTML += ' ';
			paginationHTML += `<a href="?paged=${
				current + 1
			}" class="next page-numbers">Next »</a>`;
		}
		paginationHTML += '</div>';
		return paginationHTML;
	}
} );
