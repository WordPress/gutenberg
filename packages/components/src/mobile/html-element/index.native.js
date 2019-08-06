/**
 * External dependencies
 */
import { drop, every, head, isEqual, isString, flatMap, pick, some } from 'lodash';
import { Image, View } from 'react-native';
import { CssSelectorParser } from 'css-selector-parser';

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

const parser = new CssSelectorParser();

const parseSelectorRules = ( css ) => {
    const parsedRules = parser.parse( css );
    if ( parsedRules.type === 'ruleSet' ) {
        return [ parsedRules.rule ];
    } else if ( parsedRules.type === 'selectors' ) {
        return parsedRules.selectors.map( ruleSet => ruleSet.rule );
    } else {
        throw new Error( `Unexpected selector type ${ parsedRules.type }`);
    }
}


const reverseRule = ( rule, parent ) => {
    const currentRule = pick( rule, [ 'tagName', 'classNames', 'pseudos' ] );

    if ( parent !== undefined ) {
        currentRule.parent = parent;
    }

    if ( rule.rule === undefined ) {
        return currentRule;
    } else {
		const { nestingOperator, ...childRule } = rule.rule;
        const parent = {
            nestingOperator,
            rule: currentRule,
        }
        return reverseRule( childRule, parent );
    }
}

const matchTagName = ( { tagName: selector }, { tagName: nodeTagName } ) => {
	return selector === undefined
		|| selector === '*'
		|| selector === nodeTagName;
}

const matchClassNames = ( rule, node ) => {
	const { classNames: ruleClassNames } = rule;
	const { classNames: nodeClassNames } = node;
	return every( ruleClassNames, className => nodeClassNames.includes( className ) );
}

const matchPseudos = ( rule, node ) => {
	if ( rule.pseudos !== undefined ) {
		// We don't support pseudos yet
		return false;
	}
}

const matchId = ( rule, node ) => {
	if ( rule.id !== undefined ) {
		// We don't support IDs yet
		return false;
	}
}

const matchNode = ( rule, node ) => matchTagName( rule, node )
	&& matchClassNames( rule, node);

const matchParent = ( rule, path ) => {
	const { parent } = rule;
	if ( parent === undefined ) {
		return true;
	}

	const { rule: parentRule, nestingOperator } = parent;
	if ( !! nestingOperator ) {
		// Only descendant operator suported for now
		return false;
	}

	let parentPath = path;
	while ( ( parentPath = drop( parentPath) ) && parentPath.length > 0 ) {
		if ( matchCSSPathWithRule( parentPath, parentRule ) ) {
			return true;
		}
	}

	return false
};

const matchCSSPathWithRule = ( path, rule ) => {
	const node = head( path );

	if ( node === undefined ) {
		return;
	}

	return matchNode( rule, node ) && matchParent( rule, path );
}

const matchCSSPathWithSelector = ( path, selector ) => {
	try {
		const rules = parseSelectorRules( selector )
			.map( rule => reverseRule( rule ) );

		return some( rules, rule => matchCSSPathWithRule( path, rule ) );
	} catch ( error ) {
		debugger;
		console.warn( `Error parsing CSS selector (${ selector }):`, error );
	}
}

class HTMLElementContainer extends Component {
	createCSSNode( tagName, className, siblingPosition, siblingCount ) {
		const classNames = className ? className.split( ' ' ) : [];
		return { tagName, classNames, siblingPosition, siblingCount };
	}

	createCSSPath( ancestorPath = [], tagName, className, siblingPosition, siblingCount ) {
		const node = this.createCSSNode( tagName, className, siblingPosition, siblingCount );
		return [ node, ...ancestorPath ];
	}

	cssPathToString( path ) {
		return path.reverse().map( this.cssNodeToString ).join( '>' );
	}

	cssNodeToString( node ) {
		const { tagName, classNames, siblingPosition, siblingCount } = node;
		const classNamesJoined = classNames ?
			classNames.map( ( cls ) => '.' + cls ).join( '' ) :
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

	computeStyle( path, stylesheet ) {
		if ( stylesheet === undefined ) {
			return {};
		}

		const matchingRules = stylesheet.filter( rule => {
			// Each rule can have multiple selectors
			// Check that at least one of them matches
			return some( rule.selectors, selector => matchCSSPathWithSelector( path, selector ) );
		} );

		const matchingDeclarations = flatMap( matchingRules, rule => rule.declarations );

		return matchingDeclarations.reduce( ( result, declaration ) => {
			return {
				...result,
				...declaration
			}
		}, {});
	}

	render() {
		const { tagName, stylesheet, children, ...otherProps } = this.props;
		const { className, style } = otherProps;

		const NativeComponent = this.nativeComponent( tagName );
		const nativeProps = this.nativeProps( tagName, otherProps );

		return (
			<Consumer>
				{ ( { ancestorPath, siblingPosition = 1, siblingCount = 1 } ) => {
					const path = this.createCSSPath( ancestorPath, tagName, className, siblingPosition, siblingCount );
					// TODO: calculate native style from stylesheet + path
					const computedStyle = this.computeStyle( path, stylesheet );

					const childrenCount = Children.count( children );

					// We only add the cssPath as a prop to help with debugging
					const cssPath = __DEV__ ? this.cssPathToString( path ) : undefined;

					return (
						<NativeComponent
							{ ...nativeProps }
							cssPath={ cssPath }
							style={ { ...computedStyle, ...style } }
						>
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
