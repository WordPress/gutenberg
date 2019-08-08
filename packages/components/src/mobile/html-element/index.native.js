/**
 * External dependencies
 */
import { isString, flatMap, some } from 'lodash';
import { Image, View } from 'react-native';
import {
	Element as CSSElement,
	matchCSSPathWithSelectorString,
	Path as CSSPath,
} from 'css-match';

/**
 * WordPress dependencies
 */
import { compose, createHigherOrderComponent } from '@wordpress/compose';
import { createContext, cloneElement, Children, Component, forwardRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { withStyles } from '../../styles-provider';

const { Consumer, Provider } = createContext( {} );

class HTMLElementContainer extends Component {
	renderImage( childProps ) {
		const { src: uri, ...otherProps } = childProps;
		const props = {
			...otherProps,
			source: {
				uri,
			},
		};

		return (
			<Image { ...props } />
		);
	}

	renderView( childProps ) {
		return (
			<View { ...childProps } />
		);
	}

	nativeComponent( tagName ) {
		return tagName === 'img' ? Image : View;
	}

	nativeProps( tagName, props ) {
		if ( tagName === 'img' ) {
			const { src: uri, ...otherProps } = props;
			return {
				...otherProps,
				source: {
					uri,
				},
			};
		}
		return props;
	}

	injectContextIntoChildren( cssPath, children ) {
		const siblingCount = Children.count( children );
		return Children.map( children, ( child, siblingPosition ) => {
			return cloneElement( child, { siblingCount, siblingPosition, ancestorPath: cssPath } );
		} );
	}

	computeStyle( path, stylesheet ) {
		if ( stylesheet === undefined ) {
			return {};
		}

		const matchingRules = stylesheet.filter( ( rule ) => {
			// Each rule can have multiple selectors
			// Check that at least one of them matches
			return some( rule.selectors, ( selector ) => matchCSSPathWithSelectorString( path, selector ) );
		} );

		const matchingDeclarations = flatMap( matchingRules, ( rule ) => rule.declarations );

		return matchingDeclarations.reduce( ( result, declaration ) => {
			return {
				...result,
				...declaration,
			};
		}, {} );
	}

	render() {
		const { tagName, stylesheet, children, ...otherProps } = this.props;
		const { className, style } = otherProps;

		return (
			<Consumer>
				{ ( { ancestorPath, siblingPosition = 1, siblingCount = 1 } ) => {
					const element = new CSSElement( tagName, { className, siblingPosition, siblingCount } );
					const path = new CSSPath( element, ancestorPath );
					// TODO: calculate native style from stylesheet + path
					const computedStyle = this.computeStyle( path, stylesheet );

					const childrenCount = Children.count( children );

					// We only add the cssPath as a prop to help with debugging
					const cssPath = __DEV__ ? path.inspect() : undefined;
					const NativeComponent = this.nativeComponent( tagName );
					const nativeProps = this.nativeProps( tagName, otherProps );

					return (
						<NativeComponent
							{ ...nativeProps }
							cssPath={ cssPath }
							style={ { ...computedStyle, ...style } }
						>
							{ Children.map( children, ( child, childrenPosition ) => {
								const childContext = {
									ancestorPath: path,
									siblingPosition: childrenPosition,
									siblingCount: childrenCount,
								};
								return (
									<Provider value={ childContext }>
										{ child }
									</Provider>
								);
							} ) }
						</NativeComponent>
					);
				} }
			</Consumer>
		);
	}
}

const withTagName = ( tagName ) => createHigherOrderComponent( ( OriginalComponent ) => {
	return forwardRef( ( props, ref ) => (
		<OriginalComponent
			ref={ ref }
			{ ...props }
			tagName={ tagName }
		/>
	) );
}, `withTagName(${ tagName })` );

const HTMLElement = compose( [
	withStyles,
] )( HTMLElementContainer );

HTMLElement.displayName = 'HTMLElement';

HTMLElement.supportedTags = [
	'div',
	'figure',
	'figcaption',
	'label',
	'li',
	'ol',
	'span',
	'ul',
	'img',
];

HTMLElement.supportsType = ( type ) => {
	return isString( type ) && HTMLElement.supportedTags.includes( type );
};

HTMLElement.withTagName = ( tagName ) => {
	return compose(
		withTagName( tagName )
	)( HTMLElement );
};

HTMLElement.serialize = ( props ) => {
	const { tagName: nativeComponent, ...nativeProps } = props;
	return {
		nativeComponent,
		nativeProps,
	};
};

function createElementFilter( type, ...otherArguments ) {
	if ( HTMLElement.supportsType( type ) ) {
		const Element = HTMLElement.withTagName( type );
		return [ Element, ...otherArguments ];
	}
	return arguments;
}

addFilter(
	'element.createElement',
	'core/components/mobile/html-element',
	createElementFilter
);

export default HTMLElement;
