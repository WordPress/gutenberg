import type { Decorator } from '@storybook/react-vite';
import { Link } from '../..';
import { Button } from '../../button';

export const formDecorator: Decorator = ( Story ) => (
	<form
		style={ {
			fontFamily: 'sans-serif',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'flex-start',
			gap: 16,
		} }
		onSubmit={ ( event ) => {
			event.preventDefault();
			// eslint-disable-next-line no-alert
			alert( 'Form submitted!' );
		} }
	>
		<div
			style={ {
				display: 'flex',
				flexDirection: 'column',
				gap: 16,
				alignItems: 'stretch',
				width: 300,
			} }
		>
			<Story />
		</div>

		<Button type="submit">Submit</Button>
	</form>
);

export const WITH_DETAILS_DESCRIPTION = `\
To add rich content (such as links) to the description, use the \`details\` prop.

Although this content is not associated with the field using direct semantics,
it is made discoverable to screen reader users via a visually hidden description,
alerting them to the presence of additional information below.

**Important:** If the content only includes plain text, use \`description\` instead,
so the readout is not unnecessarily verbose for screen reader users.`;

export const DETAILS_EXAMPLE = (
	<>
		Details can include{ ' ' }
		<Link href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a">
			links to more information
		</Link>{ ' ' }
		and other semantic elements.
	</>
);
