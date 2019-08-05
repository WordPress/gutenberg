/**
 * External dependencies
 */
import { isString } from 'lodash';
import { Image, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { compose, createHigherOrderComponent } from '@wordpress/compose';
import { createContext, cloneElement, Children, Component, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { withStyles } from '../../styles-provider';

const CSS_NODE_PROPS = [ 'tagName', 'className', 'siblingPosition', 'siblingCount' ];

const { Consumer, Provider } = createContext( {} );

class HTMLElementContainer extends Component {
	createCSSNode( tagName, className, siblingPosition, siblingCount ) {
		return { tagName, className, siblingPosition, siblingCount };
	}

	createCSSPath( ancestorPath = [], tagName, className, siblingPosition, siblingCount ) {
		const node = this.createCSSNode( tagName, className, siblingPosition, siblingCount );
		return [ ...ancestorPath, node ];
	}

	cssPathToString( path ) {
		return path.map( this.cssNodeToString ).join( '>' );
	}

	cssNodeToString( node ) {
		const { tagName, className, siblingPosition, siblingCount } = node;
		const classNamesJoined = className ?
			className.split( ' ' ).map( ( cls ) => '.' + cls ).join( '' ) :
			'';
		return `${ tagName }(${ siblingPosition }/${ siblingCount })${ classNamesJoined }`;
	}

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

	render() {
		const { tagName, stylesheet, children, ...otherProps } = this.props;
		const { className } = otherProps;

		const NativeComponent = this.nativeComponent( tagName );
		const nativeProps = this.nativeProps( tagName, otherProps );

		return (
			<Consumer>
				{ ( { ancestorPath, siblingPosition = 1, siblingCount = 1 } ) => {
					const path = this.createCSSPath( ancestorPath, tagName, className, siblingPosition, siblingCount );
					// TODO: calculate native style from stylesheet + path

					const childrenCount = Children.count( children );

					// We only add the cssPath as a prop to help with debugging
					const cssPath = __DEV__ ? this.cssPathToString( path ) : undefined;

					return (
						<NativeComponent { ...nativeProps } cssPath={ cssPath }>
							{ Children.map( children, ( child, siblingPosition ) => {
								const childContext = {
									ancestorPath: path,
									siblingPosition,
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

export default HTMLElement;
