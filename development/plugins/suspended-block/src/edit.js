/**
 * External dependencies
 */
import React, { Suspense } from 'react';

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { useSuspenseSelect, useSelect } from '@wordpress/data';
import { Spinner } from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';
import fetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import './editor.scss';

export default function Edit() {
	return (
		<div { ...useBlockProps() }>
			<Suspense fallback={ <Spinner /> }>
				<SuspenseEntities />
			</Suspense>
		</div>
	);
}

function FetchEntities() {
	const [ entities, setEntities ] = React.useState( undefined );

	React.useEffect( () => {
		fetch( { path: '?rest_route=/wp/v2/pag' } )
			.then( ( data ) => {
				setEntities( data ?? null );
			} )
			.catch( ( err ) => {
				console.error( err );
				setEntities( null );
			} );
	}, [] );

	if ( entities === undefined ) {
		return <Spinner />;
	}
	if ( entities === null ) {
		return <p>No entities found</p>;
	}

	return <Entities entities={ entities } />;
}

function SuspenseEntities() {
	const { entities } = useSuspenseSelect( ( select ) => {
		return {
			entities: select( 'core' ).getEntityRecords( 'postType', 'page' ),
		};
	}, [] );

	return <Entities entities={ entities } />;
}

function SelectEntities() {
	const { entities } = useSelect( ( select ) => {
		return {
			entities: select( 'core' ).getEntityRecords( 'postType', 'page' ),
		};
	}, [] );

	return <Entities entities={ entities } />;
}

function EntitiesRecords() {
	const entities = useEntityRecords( 'postType', 'page' );

	console.log( entities );

	if ( entities.status === 'IDLE' ) {
		return null;
	}
	if ( entities.isResolving ) {
		return <Spinner />;
	}
	if ( entities.status === 'ERROR' ) {
		return <p>Error loading entities</p>;
	}
	if ( entities.hasResolved && ! entities.records ) {
		return <p>No entities found</p>;
	}

	return <Entities entities={ entities.records } />;
}

function Entities( { entities } ) {
	return (
		<ul>
			{ entities.map( ( entity ) => (
				<li key={ entity.id }>
					<a href={ entity.link }>{ entity.title.rendered }</a>
				</li>
			) ) }
		</ul>
	);
}
