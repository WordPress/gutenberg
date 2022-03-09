/**
 * Internal dependencies
 */
import BaseControl from '../';
import Button from '../../button';
import { Spacer } from '../../spacer';
import TextareaControl from '../../textarea-control';

export default {
	title: 'Components/BaseControl',
	component: BaseControl,
	subcomponents: { BaseControl: BaseControl.VisualLabel },
};

const BaseControlWithTextarea = ( { id, ...props } ) => {
	return (
		<BaseControl id={ id } { ...props }>
			<TextareaControl id={ id } />
		</BaseControl>
	);
};

export const Default = BaseControlWithTextarea.bind( {} );
Default.args = {
	id: 'textarea-1',
	label: '',
	hideLabelFromVision: false,
	help: '',
};

export const WithLabel = BaseControlWithTextarea.bind( {} );
WithLabel.args = {
	...Default.args,
	label: 'Label text',
};

export const WithHelpText = BaseControlWithTextarea.bind( {} );
WithHelpText.args = {
	...WithLabel.args,
	help: 'Help text adds more explanation.',
};

export const WithVisualLabel = ( { visualLabelChildren, ...props } ) => {
	return (
		<>
			<BaseControl { ...props }>
				<div>
					<BaseControl.VisualLabel>
						{ visualLabelChildren }
					</BaseControl.VisualLabel>
				</div>
				<Button variant="secondary">Select an author</Button>
			</BaseControl>
			<Spacer marginTop={ 12 }>
				<p>
					<code>BaseControl.VisualLabel</code> is used to render a
					purely visual label inside a <code>BaseControl</code>{ ' ' }
					component.
				</p>
				<p>
					It should <strong>only</strong> be used in cases where the
					children being rendered inside BaseControl are already
					accessibly labeled, e.g., a button, but we want an
					additional visual label for that section equivalent to the
					labels BaseControl would otherwise use if the{ ' ' }
					<code>label</code> prop was passed.
				</p>
			</Spacer>
		</>
	);
};
WithVisualLabel.args = {
	...Default.args,
	help: 'This button is already accessibly labeled.',
	visualLabelChildren: 'Author',
};
WithVisualLabel.argTypes = {
	visualLabelChildren: {
		name: 'VisualLabel children',
	},
};
