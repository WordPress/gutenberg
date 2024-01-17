/**
 * External dependencies
 */
import type { Meta, StoryContext, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Composite,
	CompositeItem,
	CompositeRow,
	CompositeExperienceHelper,
	useCompositeStore,
} from '../v2';

const meta: Meta< typeof CompositeExperienceHelper > = {
	title: 'Components/Composite/CompositeExperienceHelper',
	id: 'composite-experience-helper',
	component: CompositeExperienceHelper,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			source: {
				transform: ( _: unknown, context: StoryContext ) => {
					const props = Object.entries( context.args )
						.map(
							( [ key, value ] ) =>
								` ${ key }={ ${ JSON.stringify( value ) } }`
						)
						.join( '' );
					return [
						`<CompositeExperienceHelper${ props }>`,
						'  <Composite store={ store }>',
						'    ...',
						'  </Composite>',
						'</CompositeExperienceHelper>',
					].join( '\n' );
				},
			},
		},
	},
};
export default meta;

const Template: StoryFn< typeof CompositeExperienceHelper > = ( props ) => {
	const store = useCompositeStore( { rtl: isRTL() } );

	return (
		<CompositeExperienceHelper { ...props }>
			<Composite store={ store } role="grid">
				<CompositeRow role="row">
					<CompositeItem role="gridcell">A1</CompositeItem>
					<CompositeItem role="gridcell">A2</CompositeItem>
					<CompositeItem role="gridcell">A3</CompositeItem>
				</CompositeRow>
				<CompositeRow role="row">
					<CompositeItem role="gridcell">B1</CompositeItem>
					<CompositeItem role="gridcell">B2</CompositeItem>
					<CompositeItem role="gridcell">B3</CompositeItem>
				</CompositeRow>
				<CompositeRow role="row">
					<CompositeItem role="gridcell">C1</CompositeItem>
					<CompositeItem role="gridcell">C2</CompositeItem>
					<CompositeItem role="gridcell">C3</CompositeItem>
				</CompositeRow>
			</Composite>
		</CompositeExperienceHelper>
	);
};

export const Default = Template.bind( {} );
Default.args = {};

export const WithAudibleDisabled = Template.bind( {} );
WithAudibleDisabled.args = { ...Default.args, audible: false };

export const WithVisibleDisabled = Template.bind( {} );
WithVisibleDisabled.args = { ...Default.args, visible: false };

export const WithCustomMessage = Template.bind( {} );
WithCustomMessage.args = { ...Default.args, message: 'An alternative prompt' };
