/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import Link from '../routes/link';
import AddedBy from './added-by';
import { useHistory } from '../routes';

const config = {
	wp_template: {
		fields: [
			{
				label: __( 'Image' ),
				value: 'featured_media',
				type: 'image',
			},
			{
				label: __( 'Title' ),
				value: 'title',
				type: 'title',
				fallback: 'slug',
			},
		],
	},
	wp_template_part: {
		fields: [
			{
				label: __( 'Image' ),
				value: 'featured_media',
				type: 'image',
			},
			{
				label: __( 'Title' ),
				value: 'title',
				fallback: 'slug',
				type: 'title',
			},
		],
	},
	page: {
		fields: [
			{
				label: __( 'Image' ),
				value: 'featured_media',
				type: 'image',
			},
			{
				label: __( 'Title' ),
				value: 'title',
				fallback: 'slug',
				type: 'title',
			},
		],
	},
};

export default function Grid( { templateType, filters = {} } ) {
	const { records: templates, isResolving: isLoading } = useEntityRecords(
		'postType',
		templateType,
		{
			per_page: -1,
			...filters,
		}
	);
	const postType = useSelect(
		( select ) => select( coreStore ).getPostType( templateType ),
		[ templateType ]
	);

	const history = useHistory();

	if ( ! templates || isLoading ) {
		return null;
	}

	if ( ! templates.length ) {
		return (
			<div>
				{ sprintf(
					// translators: The template type name, should be either "templates" or "template parts".
					__( 'No %s found.' ),
					postType?.labels?.name?.toLowerCase()
				) }
			</div>
		);
	}

	const sortedTemplates = [ ...templates ];
	sortedTemplates.sort( ( a, b ) => a.slug.localeCompare( b.slug ) );

	const handleRowClick = ( template ) => {
		history.push( {
			postId: template.id,
			postType: template.type,
			canvas: 'edit',
		} );
	};

	return (
		// These explicit aria roles are needed for Safari.
		// See https://developer.mozilla.org/en-US/docs/Web/CSS/display#tables
		<div className="edit-site-list-grid">
			{ sortedTemplates.map( ( template ) => (
				<Button
					key={ template.id }
					className="edit-site-list-grid__item"
					onClick={ () => handleRowClick( template ) }
				>
					{ config[ templateType ].fields.map( ( field ) => (
						<FieldValue
							key={ field.value }
							template={ template }
							type={ field.type }
							value={ field.value }
							fallback={ field.fallback }
						/>
					) ) }
				</Button>
			) ) }
		</div>
	);
}

const FieldValue = ( { template, type, value, fallback } ) => {
	switch ( type ) {
		case 'addedBy':
			return (
				<AddedBy postType={ template.type } postId={ template.id } />
			);
		case 'title':
			return (
				<Heading as="h4" level={ 5 }>
					<Link
						params={ {
							postId: template.id,
							postType: template.type,
							canvas: 'edit',
						} }
					>
						{ decodeEntities(
							template[ value ]?.rendered || template[ fallback ]
						) }
					</Link>
				</Heading>
			);
		case 'text':
			return (
				<Text numberOfLines={ 2 } truncate>
					{ template[ value ] }
				</Text>
			);
		case 'image':
			return (
				<div
					style={ {
						borderRadius: 2,
						backgroundColor: 'rgba(255,255,255,.05)',
						width: '100%',
						height: 300,
					} }
				/>
			);
		case 'rendered':
			return (
				<Text numberOfLines={ 2 } truncate>
					{ decodeEntities(
						template[ value ]?.rendered || template[ fallback ]
					) }
				</Text>
			);
	}

	return <div></div>;
};
