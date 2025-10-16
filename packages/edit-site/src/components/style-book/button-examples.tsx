/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { __experimentalGrid as Grid } from '@wordpress/components';
import { View } from '@wordpress/primitives';
import {
	BlockList,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { ExperimentalBlockEditorProvider, useGlobalStyle } = unlock(
	blockEditorPrivateApis
);

const BUTTON_STATES = [
	{
		key: 'default',
		title: __( 'Button' ),
	},
	{
		key: ':active',
		title: __( 'Button (Active)' ),
	},
	{
		key: ':any-link',
		title: __( 'Button (Any Link)' ),
	},
	{
		key: ':focus',
		title: __( 'Button (Focus)' ),
	},
	{
		key: ':hover',
		title: __( 'Button (Hover)' ),
	},
	{
		key: ':link',
		title: __( 'Button (Link)' ),
	},
	{
		key: ':visited',
		title: __( 'Button (Visited)' ),
	},
];

function ButtonExamples() {
	const [ elementsButton ] = useGlobalStyle( 'elements.button' );
	const blocks = BUTTON_STATES.map( ( { key } ) => {
		const styles =
			( key !== 'default' ? elementsButton[ key ] : elementsButton ) ||
			{};
		return createBlock( 'core/button', {
			text: __( 'Call to Action' ),
			style: styles,
		} );
	} );

	return (
		<Grid columns={ 2 } gap={ 6 }>
			{ blocks.map( ( block, index ) => (
				<View key={ `button-example-${ BUTTON_STATES[ index ].key }` }>
					<span className="edit-site-style-book__example-subtitle">
						{ BUTTON_STATES[ index ].title }
					</span>
					<ExperimentalBlockEditorProvider value={ [ block ] }>
						<BlockList appender={ false } />
					</ExperimentalBlockEditorProvider>
				</View>
			) ) }
		</Grid>
	);
}

export default ButtonExamples;
