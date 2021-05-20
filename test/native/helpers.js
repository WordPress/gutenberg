/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react-native';

export async function initializeEditor( { initialHtml } ) {
	const Editor = require( '@wordpress/edit-post/src/editor' ).default;
	const renderResult = render(
		<Editor
			postId={ 0 }
			postType="post"
			initialTitle="test"
			initialHtml={ initialHtml }
		/>
	);
	const { findByLabelText } = renderResult;
	const blockListWrapper = await findByLabelText( 'block-list-wrapper' );
	// onLayout event has to be explicitly dispatched in BlockList component,
	// otherwise the inner blocks are not rendered.
	fireEvent( blockListWrapper, 'layout', {
		nativeEvent: {
			layout: {
				width: 100,
			},
		},
	} );

	const extraMethods = [
		getByTextInAztec,
		getBlockAtPosition,
		addBlock,
	].reduce( ( carry, func ) => {
		return {
			...carry,
			[ func.name ]: ( ...props ) => func( renderResult, ...props ),
		};
	}, {} );

	return {
		...renderResult,
		...extraMethods,
	};
}

async function getBlockAtPosition(
	{ findAllByRole },
	blockName,
	position = 1
) {
	const instances = await findAllByRole( 'button' );
	const result = instances.filter( ( instance ) =>
		instance.props.accessibilityLabel.startsWith(
			`${ blockName } Block. Row ${ position }`
		)
	);
	return result.length ? result[ 0 ] : undefined;
}

async function addBlock( { findByLabelText }, blockName ) {
	const button = await findByLabelText( 'Add block' );
	fireEvent.press( button );
	const blockButton = await findByLabelText( `${ blockName } block` );
	fireEvent.press( blockButton );
}

// eslint-disable-next-line camelcase
async function getByTextInAztec( { UNSAFE_queryAllByType }, value ) {
	const instances = await UNSAFE_queryAllByType( 'RCTAztecView' );
	const result = instances.filter( ( instance ) => {
		const text = instance.props.text.text;
		return text === value;
	} );
	return result.length ? result[ 0 ] : undefined;
}
