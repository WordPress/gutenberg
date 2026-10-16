import type { ReactElement } from 'react';
import type { StoryFn } from '@storybook/react-vite';
import Icon from '../';
import check from '../../library/check';
import * as icons from '../../';

const meta = {
	component: Icon,
	// Shares its `id` and `title` with `storybook/stories/icons/library.story.tsx`
	// so both files merge into one entry. Change them together.
	id: 'icons-icon',
	title: 'Design System/Icons/Icon',
	parameters: {
		controls: { hideNoControlsWarning: true },
	},
};
export default meta;

export const Default = (): ReactElement => {
	return (
		<>
			<div>
				<h2>Dashicons (corrected viewport)</h2>

				<Icon icon={ check } />
				<Icon icon={ check } size={ 36 } />
				<Icon icon={ check } size={ 48 } />
			</div>
			<div>
				<h2>Material and Other</h2>

				<Icon icon={ icons.paragraph } />
				<Icon icon={ icons.paragraph } size={ 36 } />
				<Icon icon={ icons.paragraph } size={ 48 } />
			</div>
		</>
	);
};

/**
 *
 */
export const CurrentColor: StoryFn< typeof Icon > = ( args ) => {
	return (
		<div
			style={ {
				display: 'flex',
				alignItems: 'center',
				padding: '4px',
				gap: '4px',
				color: 'blue',
				border: '1px solid blue',
			} }
		>
			<Icon { ...args } />
			This div has a blue <code>color</code>, and the icon will be
			rendered in the same color.
		</div>
	);
};
CurrentColor.args = {
	icon: icons.wordpress,
};

export const StrokeScaling = (): ReactElement => (
	<table>
		<caption>Stroke-based icons at different sizes</caption>
		<thead>
			<tr>
				<th scope="col">Icon</th>
				{ [ 16, 20, 24, 36, 48 ].map( ( size ) => (
					<th key={ size } scope="col">
						{ size }px
					</th>
				) ) }
			</tr>
		</thead>
		<tbody>
			{ [
				{ label: 'Check', icon: icons.check },
				{ label: 'Paragraph', icon: icons.paragraph },
				{ label: 'Image', icon: icons.image },
				{ label: 'Settings', icon: icons.cog },
			].map( ( { label, icon } ) => (
				<tr key={ label }>
					<th scope="row">{ label }</th>
					{ [ 16, 20, 24, 36, 48 ].map( ( size ) => (
						<td key={ size }>
							<Icon icon={ icon } size={ size } />
						</td>
					) ) }
				</tr>
			) ) }
		</tbody>
	</table>
);
