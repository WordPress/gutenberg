/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import {
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { store as blocksStore } from '@wordpress/blocks';
import { Path, SVG, Button, Placeholder } from '@wordpress/components';

const getGroupPlaceholderIcons = ( name = 'group' ) => {
	const icons = {
		group: (
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				width="44"
				height="32"
				viewBox="0 0 44 32"
			>
				<Path
					d="M42 0H2C.9 0 0 .9 0 2v28c0 1.1.9 2 2 2h40c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2z"
					// style="fill:#ccc"
				/>
			</SVG>
		),
		'group-row': (
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				width="44"
				height="32"
				viewBox="0 0 44 32"
			>
				<Path
					d="M42 0H23.5c-.6 0-1 .4-1 1v30c0 .6.4 1 1 1H42c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2zM20.5 0H2C.9 0 0 .9 0 2v28c0 1.1.9 2 2 2h18.5c.6 0 1-.4 1-1V1c0-.6-.4-1-1-1z"
					// style="fill:#ccc"
				/>
			</SVG>
		),
		'group-stack': (
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				width="44"
				height="32"
				viewBox="0 0 44 32"
			>
				<Path
					d="M42 0H2C.9 0 0 .9 0 2v12.5c0 .6.4 1 1 1h42c.6 0 1-.4 1-1V2c0-1.1-.9-2-2-2zm1 16.5H1c-.6 0-1 .4-1 1V30c0 1.1.9 2 2 2h40c1.1 0 2-.9 2-2V17.5c0-.6-.4-1-1-1z"
					// style="fill:#ccc"
				/>
			</SVG>
		),
	};
	return icons?.[ name ];
};

/**
 * Display group variations if none is selected.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.clientId      The block's clientId.
 * @param {string}   props.name          The block's name.
 * @param {Function} props.setAttributes Function to set block's attributes.
 *
 * @return {JSX.Element}                The placeholder.
 */
function GroupPlaceHolder( { clientId, name, setAttributes } ) {
	const { blockType, defaultVariation, variations } = useSelect(
		( select ) => {
			const {
				getBlockVariations,
				getBlockType,
				getDefaultBlockVariation,
			} = select( blocksStore );

			const variationsWithPlaceHolderIcons = (
				getBlockVariations( name, 'block' ) || []
			).map( ( groupVariation ) => {
				const placeholderIcon = getGroupPlaceholderIcons(
					groupVariation.name
				);
				if ( !! placeholderIcon ) {
					groupVariation.placeHolderIcon = placeholderIcon;
				}
				return groupVariation;
			} );

			return {
				blockType: getBlockType( name ),
				defaultVariation: getDefaultBlockVariation( name, 'block' ),
				variations: variationsWithPlaceHolderIcons,
			};
		},
		[ name ]
	);
	const blockProps = useBlockProps( {
		className: 'wp-block-group__placeholder',
	} );
	const { selectBlock } = useDispatch( blockEditorStore );
	// Ensure that the inserted block is selected after a Group variation is selected.
	const updateSelection = useCallback(
		( newClientId ) => selectBlock( newClientId, -1 ),
		[ selectBlock ]
	);
	const selectVariation = ( nextVariation = defaultVariation ) => {
		/*
				Remove layout.isDefault if present.
				`isDefault` exists to identify blocks that have been inserted, programmatically or otherwise, with no changes.
				When a user selects a layout `isDefault` should not appear in the block's attributes.
			 */
		const { isDefault, ...rest } = nextVariation.attributes?.layout;
		const newAttributes = {
			...nextVariation.attributes,
			layout: rest,
		};
		setAttributes( newAttributes );
		updateSelection( clientId );
	};
	return (
		<div { ...blockProps }>
			<Placeholder
				icon={ blockType?.icon?.src }
				label={ blockType?.title }
				instructions={ __( 'Group blocks together. Select a layout:' ) }
			>
				{ /*
				 * Taken from BlockVariationPicker component.
				 * Disable reason: The `list` ARIA role is redundant but
				 * Safari+VoiceOver won't announce the list otherwise.
				 */
				/* eslint-disable jsx-a11y/no-redundant-roles */ }
				<ul
					role="list"
					className="wp-block-group-placeholder__variations"
					aria-label={ __( 'Block variations' ) }
				>
					{ variations.map( ( variation ) => (
						<li key={ variation.name }>
							<Button
								variant="tertiary"
								icon={
									variation.placeHolderIcon || variation.icon
								}
								iconSize={ 64 }
								onClick={ () => selectVariation( variation ) }
							/>
							<span role="presentation">{ variation.title }</span>
						</li>
					) ) }
				</ul>
				{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
			</Placeholder>
		</div>
	);
}

export default GroupPlaceHolder;
