/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

const getElementProps = ( props, ref ) => {
	const newProps = { ...props };
	newProps.className += ' wp-element-button';
	newProps.ref = ref;
	return newProps;
};

const ElementButton = forwardRef( ( props, ref ) => {
	return <button { ...getElementProps( props, ref ) } />;
} );

ElementButton.Link = forwardRef( ( props, ref ) => {
	// eslint-disable-next-line jsx-a11y/anchor-has-content
	return <a { ...getElementProps( props, ref ) } />;
} );

export default ElementButton;
