/**
 * External dependencies
 */
import { noop, uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';
import { createHigherOrderComponent, compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

const { Consumer, Provider } = createContext( {
	name: '',
	isSelected: false,
	focusedElement: null,
	setFocusedElement: noop,
	clientId: null,
} );

export { Provider as BlockEditContextProvider };

/**
 * A Higher Order Component used to inject BlockEdit context to the
 * wrapped component.
 *
 * @param {Function} mapContextToProps Function called on every context change,
 *                                     expected to return object of props to
 *                                     merge with the component's own props.
 *
 * @return {Component} Enhanced component with injected context as props.
 */
export const withBlockEditContext = ( mapContextToProps ) => createHigherOrderComponent( ( OriginalComponent ) => {
	return ( props ) => (
		<Consumer>
			{ ( context ) => (
				<OriginalComponent
					{ ...props }
					{ ...mapContextToProps( context, props ) }
				/>
			) }
		</Consumer>
	);
}, 'withBlockEditContext' );

/**
 * A Higher Order Component used to render conditionally the wrapped
 * component only when the BlockEdit has selected state set.
 *
 * @param {Component} OriginalComponent Component to wrap.
 *
 * @return {Component} Component which renders only when the BlockEdit is selected.
 */
export const ifBlockEditSelected = createHigherOrderComponent( ( OriginalComponent ) => {
	return ( props ) => (
		<Consumer>
			{ ( { isSelected } ) => isSelected && (
				<OriginalComponent { ...props } />
			) }
		</Consumer>
	);
}, 'ifBlockEditSelected' );

/**
 * A Higher Order Component used to render conditionally the wrapped
 * component only when the BlockEdit has selected state set or it is
 * the first block in a multi selection of all one type of block..
 *
 * @param {Component} OriginalComponent Component to wrap.
 *
 * @return {Component} Component which renders only when the BlockEdit is selected or it is the first block in a multi selection.
 */
const isFirstOrOnlyBlockSelected = createHigherOrderComponent( ( OriginalComponent ) => {
	return ( props ) => {
		return (
			<Consumer>
				{ ( { isSelected, clientId } ) => ( isSelected || ( clientId === props.getFirstMultiSelectedBlockClientId && props.allSelectedBlocksOfSameType ) ) && (
					<OriginalComponent { ...props } />
				) }
			</Consumer>
		);
	};
}, 'isFirstOrOnlyBlockSelected' );

export const withFirstOrOnlyBlockSelected = ( component ) => {
	return compose( [
		withSelect( ( select ) => {
			const {
				getMultiSelectedBlocks,
				getFirstMultiSelectedBlockClientId,
				isMultiSelecting,
			} = select( 'core/editor' );
			const allSelectedBlocksOfSameType = uniq(
				getMultiSelectedBlocks().map( ( { name } ) => name )
			).length === 1;
			return {
				getFirstMultiSelectedBlockClientId: getFirstMultiSelectedBlockClientId(),
				isSelecting: isMultiSelecting(),
				selectedBlocks: getMultiSelectedBlocks(),
				allSelectedBlocksOfSameType,
			};
		} ),
		isFirstOrOnlyBlockSelected,
	] )( component );
};
