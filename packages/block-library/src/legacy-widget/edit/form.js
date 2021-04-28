/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useCallback, RawHTML } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';

export default function Form( { id, idBase, content, setFormData } ) {
	const setFormDataDebounced = useCallback( debounce( setFormData, 300 ), [
		setFormData,
	] );

	return (
		<Control
			id={ id }
			idBase={ idBase }
			content={ content }
			onChange={ setFormDataDebounced }
			onSave={ setFormData }
			// Force a remount when the widget's form HTML changes. This clears
			// out any mutations to the DOM that widget scripts have made.
			key={ content }
		/>
	);
}

function Control( { id, idBase, content, onChange, onSave } ) {
	const controlRef = useRef();
	const formRef = useRef();

	// Trigger 'widget-added' when widget is ready. This event is what widgets'
	// scripts use to initialize, attach events, etc. The event must be fired
	// using jQuery's event bus as this is what widget scripts expect. If jQuery
	// is not loaded, do nothing - some widgets will still work regardless.
	useEffect( () => {
		if ( ! window.jQuery ) {
			return;
		}

		const { jQuery: $ } = window;

		if ( content ) {
			$( document ).trigger( 'widget-added', [
				$( controlRef.current ),
			] );
		}
	}, [ content ] );

	// Prefer jQuery 'change' event instead of the native 'change' event because
	// many widgets use jQuery's event bus to trigger an update.
	useEffect( () => {
		const handler = () => onChange( serializeForm( formRef.current ) );

		if ( window.jQuery ) {
			const { jQuery: $ } = window;
			$( formRef.current ).on( 'change', null, handler );
			return () => $( formRef.current ).off( 'change', null, handler );
		}

		formRef.current.addEventListener( 'change', handler );
		return () => formRef.current.removeEventListener( 'change', handler );
	}, [ onChange ] );

	// Non-multi widgets can be saved via a Save button.
	const handleSubmit = ( event ) => {
		event.preventDefault();
		onSave( serializeForm( event.target ) );
	};

	// We can't use the real widget number as this is calculated by the server
	// and we may not ever *actually* save this widget. Instead, use a fake but
	// unique number.
	const number = useInstanceId( Control );

	return (
		<div ref={ controlRef } className="widget open">
			<div className="widget-inside">
				<form
					ref={ formRef }
					className="form"
					method="post"
					onSubmit={ handleSubmit }
				>
					{ /* Many widgets expect these hidden inputs to exist in the DOM. */ }
					<input
						type="hidden"
						name="widget-id"
						className="widget-id"
						value={ id ?? `${ idBase }-${ number }` }
					/>
					<input
						type="hidden"
						name="id_base"
						className="id_base"
						value={ idBase ?? id }
					/>
					<input
						type="hidden"
						name="widget-width"
						className="widget-width"
						value="250"
					/>
					<input
						type="hidden"
						name="widget-height"
						className="widget-height"
						value="200"
					/>
					<input
						type="hidden"
						name="widget_number"
						className="widget_number"
						value={ idBase ? number : '' }
					/>
					<input
						type="hidden"
						name="add_new"
						className="add_new"
						value=""
					/>
					<RawHTML className="widget-content">{ content }</RawHTML>
					{ id && (
						<Button type="submit" isPrimary>
							{ __( 'Save' ) }
						</Button>
					) }
				</form>
			</div>
		</div>
	);
}

function serializeForm( form ) {
	return new window.URLSearchParams(
		Array.from( new window.FormData( form ) )
	).toString();
}
