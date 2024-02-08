import { useBlockProps } from '@wordpress/block-editor';
import { useSuspenseSelect } from '@wordpress/data';

import './editor.scss';
import React, { Suspense } from 'react';
import { Spinner } from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';

export default function Edit() {
	return (
		<div { ...useBlockProps() }>
			<Suspense fallback={ <Spinner /> }>
				<SuspenseEntities />
			</Suspense>
		</div>
	);
}

function SuspenseEntities() {
	const { entities } = useSuspenseSelect( ( select ) => {
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

	return <Entities entities={ entities.records ?? [] } />;
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
