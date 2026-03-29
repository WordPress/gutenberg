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
		<a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a">
			links to more information
		</a>{ ' ' }
		and other semantic elements.
	</>
);
