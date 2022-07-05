/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, useContext, createPortal } from '@wordpress/element';
import { TextareaControl } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { BlockList } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/*
function CustomCSSValue() {
	const [ customCSS, getCustomCSS ] = useState();

	useEffect( () => {
		apiFetch( {
			path: '/wp/v2/customcss',
		} ).then( ( res ) => {
			getCustomCSS( res );
		} );
	}, [] );

	return customCSS;
}
*/
function CustomCSSControl() {
	const [ newCSS, updateCustomCSS ] = useState();
	const [ customCSS, getCustomCSS ] = useState();

	useEffect( () => {
		apiFetch( {
			path: '/wp/v2/customcss',
		} ).then( ( res ) => {
			getCustomCSS( res );
		} );
	}, [] );
	/*
	 useEffect( () => {
		 apiFetch( {
			 path: '/wp/v2/customcss',
			 method: 'PUT', //PUT should be used for updating resources.
			 data: { post_cotent: newCSS },
		 } ).then( ( res ) => {
			 console.log( res );
		 } );
	 }, [] );
	 */

	return (
		<TextareaControl
			value={ customCSS }
			onChange={ ( value ) => updateCustomCSS( value ) }
		/>
	);
}

export default CustomCSSControl;

/**
 * Override the default block element to include custom CSS.
 *
 * @param {Function} BlockListBlock Original component.
 *
 * @return {Function} Wrapped component.
 */
const withCustomCSS = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		/*
		if ( ! customCSS ) {
			return <BlockListBlock { ...props } />;
		}
		*/
		const id = `wp-custom-css-test`;
		const className = classnames( props?.className, id );
		const element = useContext( BlockList.__unstableElementContext );

		return (
			<>
				{ element && createPortal( <style>{ __( ' *{border:3px solid purple;}' ) }</style>, element ) }
				<BlockListBlock { ...props } className={ className } />
			</>
		);
	},
	'withCustomCSS'
);

addFilter(
	'editor.BlockListBlock',
	'core/editor/custom-css/with-customcss',
	withCustomCSS
);
