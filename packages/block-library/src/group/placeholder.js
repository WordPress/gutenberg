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
		'group-grid': (
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				width="44"
				height="32"
				viewBox="0 0 44 32"
			>
				<Path d="m20.30137,-0.00025l-18.9728,0c-0.86524,0.07234 -1.41711,0.79149 -1.41711,1.89149l0,12.64468c0,0.6 0.73401,0.96383 1.0304,0.96383l19.67469,0.03617c0.29639,0 1.0304,-0.4 1.0304,-1l-0.03576,-12.7532c0,-1.1 -0.76644,-1.78297 -1.30983,-1.78297zm0.52975,16.60851l-19.99654,-0.03617c-0.29639,0 -0.92312,0.36383 -0.92312,0.96383l-0.03576,12.68085c0,1.1 0.8022,1.81915 1.34559,1.81915l19.00857,0c0.54339,0 1.45287,-0.71915 1.45287,-1.81915l0,-12.53617c0,-0.6 -0.5552,-1.07234 -0.8516,-1.07234z" />
				<Path d="m42.73056,-0.03617l-18.59217,0c-0.84788,0.07234 -1.38868,0.79149 -1.38868,1.89149l0,12.64468c0,0.6 0.71928,0.96383 1.00973,0.96383l19.27997,0.03617c0.29045,0 1.00973,-0.4 1.00973,-1l-0.03504,-12.7532c0,-1.1 -0.75106,-1.78297 -1.28355,-1.78297zm0.51912,16.60851l-19.59537,-0.03617c-0.29045,0 -0.9046,0.36383 -0.9046,0.96383l-0.03504,12.68085c0,1.1 0.78611,1.81915 1.31859,1.81915l18.62721,0c0.53249,0 1.42372,-0.71915 1.42372,-1.81915l0,-12.53617c0,-0.6 -0.54407,-1.07234 -0.83451,-1.07234z" />
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
			usedLayoutType !== 'flex' &&
			usedLayoutType !== 'grid'
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
