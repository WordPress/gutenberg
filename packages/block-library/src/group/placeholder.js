/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { store as blocksStore } from '@wordpress/blocks';
import { Path, SVG, Button, Placeholder } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

/**
 * Returns a custom variation icon.
 *
 * @param {string} name The block variation name.
 *
 * @return {JSX.Element} The SVG element.
 */
const getGroupPlaceholderIcons = ( name = 'group' ) => {
	const icons = {
		group: (
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				width="44"
				height="32"
				viewBox="0 0 44 32"
			>
				<Path d="M42 0H2C.9 0 0 .9 0 2v28c0 1.1.9 2 2 2h40c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2z" />
			</SVG>
		),
		'group-row': (
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				width="44"
				height="32"
				viewBox="0 0 44 32"
			>
				<Path d="M42 0H23.5c-.6 0-1 .4-1 1v30c0 .6.4 1 1 1H42c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2zM20.5 0H2C.9 0 0 .9 0 2v28c0 1.1.9 2 2 2h18.5c.6 0 1-.4 1-1V1c0-.6-.4-1-1-1z" />
			</SVG>
		),
		'group-stack': (
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				width="44"
				height="32"
				viewBox="0 0 44 32"
			>
				<Path d="M42 0H2C.9 0 0 .9 0 2v12.5c0 .6.4 1 1 1h42c.6 0 1-.4 1-1V2c0-1.1-.9-2-2-2zm1 16.5H1c-.6 0-1 .4-1 1V30c0 1.1.9 2 2 2h40c1.1 0 2-.9 2-2V17.5c0-.6-.4-1-1-1z" />
			</SVG>
		),
	};
	return icons?.[ name ];
};

/**
 * A custom hook to tell the Group block whether to show the variation placeholder.
 *
 * @param {Object}  props                  Arguments to pass to hook.
 * @param {Object}  [props.attributes]     The block's attributes.
 * @param {string}  [props.usedLayoutType] The block's current layout type.
 * @param {boolean} [props.hasInnerBlocks] Whether the block has inner blocks.
 *
 * @return {[boolean, Function]} A state value and setter function.
 */
export function useShouldShowPlaceHolder( {
	attributes = {
		style: undefined,
		backgroundColor: undefined,
		textColor: undefined,
		fontSize: undefined,
	},
	usedLayoutType = '',
	hasInnerBlocks = false,
} ) {
	const { style, backgroundColor, textColor, fontSize } = attributes;
	/*
	 * Shows the placeholder when no known styles are set,
	 * or when a non-default layout has been selected.
	 * Should the Group block support more style presets in the
	 * future, e.g., attributes.spacingSize, we can add them to the
	 * condition.
	 */
	const [ showPlaceholder, setShowPlaceholder ] = useState(
		! hasInnerBlocks &&
			! backgroundColor &&
			! fontSize &&
			! textColor &&
			! style &&
			usedLayoutType !== 'flex'
	);

	useEffect( () => {
		if (
			!! hasInnerBlocks ||
			!! backgroundColor ||
			!! fontSize ||
			!! textColor ||
			!! style ||
			usedLayoutType === 'flex'
		) {
			setShowPlaceholder( false );
		}
	}, [
		backgroundColor,
		fontSize,
		textColor,
		style,
		usedLayoutType,
		hasInnerBlocks,
	] );

	return [ showPlaceholder, setShowPlaceholder ];
}

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
	const variations = useSelect(
		( select ) => select( blocksStore ).getBlockVariations( name, 'block' ),
		[ name ]
	);
	const blockProps = useBlockProps( {
		className: 'wp-block-group__placeholder',
	} );
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
								onClick={ () => onSelect( variation ) }
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
