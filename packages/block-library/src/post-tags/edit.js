/**
 * WordPress dependencies
 */
import { useEntityProp, useEntityId } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';

function PostTagsDisplay( {
	attributes: { beforeText, separator, afterText },
	setAttributes,
} ) {
	const [ tags ] = useEntityProp( 'postType', 'post', 'tags' );
	const tagLinks = useSelect(
		( select ) => {
			const { getEntityRecord } = select( 'core' );
			let loaded = true;
			const links = tags.map( ( tagId ) => {
				const tag = getEntityRecord( 'taxonomy', 'post_tag', tagId );
				if ( ! tag ) {
					return ( loaded = false );
				}
				return (
					<a key={ tagId } href={ tag.link }>
						{ tag.name }
					</a>
				);
			} );
			return loaded && links;
		},
		[ tags ]
	);
	return (
		tagLinks &&
		( tagLinks.length === 0 ? (
			__( 'No tags.' )
		) : (
			<>
				<RichText
					tagName="span"
					placeholder={ __( 'Before text.' ) }
					keepPlaceholderOnFocus
					value={ beforeText }
					onChange={ ( newBeforeText ) =>
						setAttributes( { beforeText: newBeforeText } )
					}
				/>{ ' ' }
				{ tagLinks.reduce( ( prev, curr ) => [
					prev,
					<RichText
						key={ prev + curr }
						tagName="span"
						placeholder={ __( ' | ' ) }
						keepPlaceholderOnFocus
						value={ separator }
						onChange={ ( newSeparator ) =>
							setAttributes( { separator: newSeparator } )
						}
					/>,
					curr,
				] ) }{ ' ' }
				<RichText
					tagName="span"
					placeholder={ __( 'After text.' ) }
					keepPlaceholderOnFocus
					value={ afterText }
					onChange={ ( newAfterText ) =>
						setAttributes( { afterText: newAfterText } )
					}
				/>
			</>
		) )
	);
}

export default function PostTagsEdit( { attributes, setAttributes } ) {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return 'Post Tags Placeholder';
	}
	return (
		<PostTagsDisplay
			attributes={ attributes }
			setAttributes={ setAttributes }
		/>
	);
}
