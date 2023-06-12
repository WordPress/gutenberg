/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { useEntityProp } from '@wordpress/core-data';
import { useMemo, useCallback } from '@wordpress/element';

export default {
	name: 'meta',

	useSource( {
		name,
		context: { postType, postId },
		attributes,
		setAttributes,
	} ) {
		const [ meta, setMeta ] = useEntityProp(
			'postType',
			postType,
			'meta',
			postId
		);

		const blockType = getBlockType( name );

		const attributesWithSourcedAttributes = useMemo( () => {
			if ( ! blockType.supports?.customSources ) {
				return attributes;
			}
			return {
				...attributes,
				...Object.fromEntries(
					Object.keys( blockType.supports.customSources ).map(
						( attributeName ) => {
							if (
								attributes.source?.[ attributeName ]?.type ===
								'meta'
							) {
								return [
									attributeName,
									meta?.[
										attributes.source?.[ attributeName ]
											?.name
									],
								];
							}
							return [
								attributeName,
								attributes[ attributeName ],
							];
						}
					)
				),
			};
		}, [ blockType.supports?.customSources, attributes, meta ] );

		const updatedSetAttributes = useCallback(
			( nextAttributes ) => {
				const nextMeta = Object.fromEntries(
					Object.entries( nextAttributes ?? {} )
						.filter(
							// Filter to intersection of keys between the updated
							// attributes and those with an associated meta key.
							( [ key ] ) =>
								blockType.supports?.customSources &&
								key in blockType.supports?.customSources &&
								attributes.source?.[ key ]?.type === 'meta'
						)
						.map( ( [ attributeKey, value ] ) => [
							// Rename the keys to the expected meta key name.
							attributes.source?.[ attributeKey ]?.name,
							value,
						] )
				);

				const updatedAttributes = Object.entries( nextMeta ).length
					? Object.fromEntries(
							Object.entries( nextAttributes ).filter(
								( [ key ] ) =>
									! (
										blockType.supports?.customSources &&
										key in
											blockType.supports?.customSources &&
										attributes.source?.[ key ]?.type ===
											'meta'
									)
							)
					  )
					: nextAttributes;

				if ( Object.entries( nextMeta ).length ) {
					setMeta( nextMeta );
				}

				setAttributes( updatedAttributes );
			},
			[
				setAttributes,
				attributes.source,
				blockType.supports?.customSources,
				setMeta,
			]
		);

		return {
			setAttributes: updatedSetAttributes,
			attributes: attributesWithSourcedAttributes,
		};
	},
};
