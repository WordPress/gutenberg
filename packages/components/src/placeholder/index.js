/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useResizeObserver, useRefEffect } from '@wordpress/compose';
import { useState, createPortal } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Icon from '../icon';
import StyleProvider from '../style-provider';

function AdminShadow( { children } ) {
	const [ shadow, setShadow ] = useState();
	const ref = useRefEffect( ( element ) => {
		const root = element.attachShadow( { mode: 'open' } );
		Array.from( document.styleSheets ).forEach( ( { ownerNode } ) => {
			if ( ! ownerNode.getAttribute( 'data-emotion' ) ) {
				root.appendChild( ownerNode.cloneNode( true ) );
			}
		} );
		setShadow( root );
	}, [] );
	return (
		<div ref={ ref }>
			{ shadow &&
				createPortal(
					<StyleProvider document={ { head: shadow } }>
						{ children }
					</StyleProvider>,
					shadow
				) }
		</div>
	);
}

/**
 * Renders a placeholder. Normally used by blocks to render their empty state.
 *
 * @param {Object}    props                The component props.
 * @param {WPIcon}    props.icon           An icon rendered before the label.
 * @param {WPElement} props.children       Children to be rendered.
 * @param {string}    props.label          Title of the placeholder.
 * @param {string}    props.instructions   Instructions of the placeholder.
 * @param {string}    props.className      Class to set on the container div.
 * @param {Object}    props.notices        A rendered notices list.
 * @param {Object}    props.preview        Preview to be rendered in the placeholder.
 * @param {boolean}   props.isColumnLayout Whether a column layout should be used.
 *
 * @return {Object} The rendered placeholder.
 */
function Placeholder( {
	icon,
	children,
	label,
	instructions,
	className,
	notices,
	preview,
	isColumnLayout,
	...additionalProps
} ) {
	const [ resizeListener, { width } ] = useResizeObserver();

	// Since `useResizeObserver` will report a width of `null` until after the
	// first render, avoid applying any modifier classes until width is known.
	let modifierClassNames;
	if ( typeof width === 'number' ) {
		modifierClassNames = {
			'is-large': width >= 480,
			'is-medium': width >= 160 && width < 480,
			'is-small': width < 160,
		};
	}

	const classes = classnames(
		'components-placeholder',
		className,
		modifierClassNames
	);
	const fieldsetClasses = classnames( 'components-placeholder__fieldset', {
		'is-column-layout': isColumnLayout,
	} );
	return (
		<AdminShadow>
			<div { ...additionalProps } className={ classes }>
				{ resizeListener }
				{ notices }
				{ preview && (
					<div className="components-placeholder__preview">
						{ preview }
					</div>
				) }
				<div className="components-placeholder__label">
					<Icon icon={ icon } />
					{ label }
				</div>
				{ !! instructions && (
					<div className="components-placeholder__instructions">
						{ instructions }
					</div>
				) }
				<div className={ fieldsetClasses }>{ children }</div>
			</div>
		</AdminShadow>
	);
}

export default Placeholder;
