/**
 * External dependencies
 */
import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router';
import axios from 'axios';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import Document from './document';
import Typography from './typography';

function getEndpoint( params ) {
	const { path } = params;
	const endpoint = `/_data/${ path }/index.json`;

	return endpoint;
}

async function fetchData( path ) {
	const url = getEndpoint( {
		path,
	} );
	const response = await axios.get( url );
	const data = response.data;

	return data;
}

function getComponentFromProps( props ) {
	const { location } = props;
	return location.pathname || '';
}

function useSetDocumentTitle( title ) {
	useEffect( () => {
		let nextTitle = 'WordPress Components';
		if ( title ) {
			nextTitle = `${ title } | WordPress Components`;
		}
		window.document.title = nextTitle;
	}, [ title ] );
}

function useScrollToTop() {
	useEffect( () => {
		window.scrollTo( 0, 0 );
	} );
}

function Page( props ) {
	const path = getComponentFromProps( props );

	const [ state, setState ] = useState( {} );
	const [ isLoaded, setLoaded ] = useState( false );

	useEffect( () => {
		async function fetchAndLoadData() {
			const data = await fetchData( path );

			if ( ! data ) {
				return;
			}

			setState( data );
			setLoaded( true );

			return data;
		}

		fetchAndLoadData();

		return () => {
			setLoaded( false );
		};
	}, [ setState, setLoaded, path ] );

	const { title, markdown } = state;

	useScrollToTop();
	useSetDocumentTitle( title );

	if ( ! path ) {
		return null;
	}

	const className = isLoaded ? 'is-ready' : '';

	return (
		<PageUI className={ className }>
			<Typography className={ className }>
				<Document markdown={ markdown } />
			</Typography>
		</PageUI>
	);
}

const PageUI = styled( 'div' )`
	opacity: 0;
	transition-delay: 0ms;
	transition-duration: 0ms;
	transition-property: opacity;
	transition-timing-function: linear;

	&.is-ready {
		opacity: 1;
		transition-duration: 250ms;
	}
`;

export default withRouter( Page );
