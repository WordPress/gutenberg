/**
 * WordPress dependencies
 */
import { createSlotFill, Toolbar } from '@wordpress/components';
import { createHigherOrderComponent, compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { withFirstOrOnlyBlockSelected } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'MultiBlockControls' );

const MultiBlockControlsFill = ( { controls, children } ) => (
	<Fill>
		<Toolbar controls={ controls } />
		{ children }
	</Fill>
);

const MultiBlockControls = withFirstOrOnlyBlockSelected( MultiBlockControlsFill );

MultiBlockControls.Slot = Slot;

export default MultiBlockControls;

/**
 * Reduces blocks to a single attribute's value, taking the first in the list as
 * a default, returning `undefined` if all blocks are not the same value.
 *
 * @param {Array}  multiSelectedBlocks Array of selected blocks.
 * @param {string} attributeName       Attribute name.
 *
 * @return {*}     Reduced value of attribute.
 */
function reduceAttribute( multiSelectedBlocks, attributeName ) {
	let attribute;
	// Reduce the selected block's attributes, so if they all have the
	// same value for an attribute, we get it in the multi toolbar attributes.
	for ( let i = 0; i < multiSelectedBlocks.length; i++ ) {
		const block = multiSelectedBlocks[ i ];
		if ( block.attributes[ attributeName ] === attribute || 0 === i ) {
			attribute = block.attributes[ attributeName ];
		} else {
			attribute = undefined;
		}
	}
	return attribute;
}

/**
 * Adds multi block support to a block control. If the control is used when there is a
 * multi block selection, the `onChange` and `value` props are intercepted, and uses
 * `reduceAttribute` to get a single value for the control from all selected blocks,
 * and changes all selected blocks with the new value.
 *
 * This requires that multi block controls have `value` and `onChange` props, and
 * set attributes on blocks with no other side effects (other than those handled
 * when the edit component receives new props)
 *
 * @param {Component}  component     Component to make multi block selection aware.
 * @param {string}     attributeName Attribute name the component controls.
 *
 * @return {Component} Component that can handle multple selected blocks.
 */
export const withMultiBlockSupport = ( component, attributeName ) => createHigherOrderComponent( ( OriginalComponent ) => {
	const multSelectComponent = ( props ) => {
		let newProps = props;
		if ( props.multiSelectedBlocks.length > 1 ) {
			newProps = { ...props };
			newProps.value = reduceAttribute( props.multiSelectedBlocks, attributeName );
			newProps.onChange = ( newValue ) => {
				const newAttributes = {
					[ attributeName ]: newValue,
				};
				for ( let i = 0; i < props.multiSelectedBlocks.length; i++ ) {
					newProps.onMultiBlockChange( props.multiSelectedBlocks[ i ].clientId, newAttributes );
				}
			};
		}
		return (
			<OriginalComponent { ...newProps } />
		);
	};
	return compose( [
		withSelect( ( select ) => {
			const { getMultiSelectedBlocks } = select( 'core/editor' );
			return {
				multiSelectedBlocks: getMultiSelectedBlocks(),
			};
		} ),
		withDispatch( ( dispatch ) => {
			const { updateBlockAttributes } = dispatch( 'core/editor' );
			return {
				onMultiBlockChange( uid, attributes ) {
					updateBlockAttributes( uid, attributes );
				},
			};
		} ),
	] )( multSelectComponent );
}, 'withMultiBlockSupport' )( component );
