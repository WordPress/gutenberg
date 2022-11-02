/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useBlockProps } from '@wordpress/block-editor';
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
 * @param {Object}   props          Component props.
 * @param {string}   props.name     The block's name.
 * @param {Function} props.onSelect Function to set block's attributes.
 *
 * @return {JSX.Element}                The placeholder.
 */
function GroupPlaceHolder( { name, onSelect } ) {
	const { defaultVariation, variations } = useSelect(
		( select ) => {
			const { getBlockVariations, getDefaultBlockVariation } =
				select( blocksStore );
			return {
				defaultVariation: getDefaultBlockVariation( name, 'block' ),
				variations: getBlockVariations( name, 'block' ) || [],
			};
		},
		[ name ]
	);
	const blockProps = useBlockProps( {
		className: 'wp-block-group__placeholder',
	} );
	const selectVariation = ( nextVariation = defaultVariation ) =>
		onSelect( nextVariation.attributes );

	return (
		<div { ...blockProps }>
			<Placeholder
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
								icon={ getGroupPlaceholderIcons(
									variation.name
								) }
								iconSize={ 44 }
								onClick={ () => selectVariation( variation ) }
								className="wp-block-group-placeholder__variation-button"
								label={ `${ variation.title }: ${ variation.description }` }
							/>
						</li>
					) ) }
				</ul>
				{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
			</Placeholder>
		</div>
	);
}

export default GroupPlaceHolder;
