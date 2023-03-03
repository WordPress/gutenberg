/**
 * WordPress dependencies
 */
import { useId, useState } from '@wordpress/element';

export const WithCustomControls = ( Story, context ) => {
	const textareaId = useId();
	const [ partialProps, setPartialProps ] = useState( {} );

	if ( context.globals.customE2EControls === 'hide' ) {
		return <Story { ...context } />;
	}

	const contextWithControlledProps = {
		...context,
		// override args with the ones set by custom controls
		args: { ...context.args, ...partialProps },
	};

	return (
		<>
			<Story { ...contextWithControlledProps } />

			<p>Props:</p>
			<pre>
				{ JSON.stringify(
					contextWithControlledProps.args,
					undefined,
					4
				) }
			</pre>

			<hr />

			<form
				name="e2e-controls-form"
				onSubmit={ ( event ) => {
					event.preventDefault();

					const propsRawText = event.target.elements.props.value;

					const propsParsed = JSON.parse( propsRawText );

					setPartialProps( ( oldProps ) => ( {
						...oldProps,
						...propsParsed,
					} ) );
				} }
			>
				<p>
					<label htmlFor={ textareaId }>Raw props</label>
					<textarea name="props" id={ textareaId } />
				</p>
				<button type="submit">Set props</button>
			</form>
		</>
	);
};
