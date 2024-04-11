/**
 * WordPress dependencies
 */
import { store, getContext, useState, useCallback, privateApis } from '@wordpress/interactivity';

const { directive } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

store( 'directive-function', {
	state: {
		colors: [ "white", "magenta", "cyan", "yellow" ]
	},
	actions: {
		updateCount: () => {
			const context = getContext();
			context.count += 1;
		},
		loadAsyncDirective: () => {
			directive(
				'async-bg-color',
				( { directives: { 'async-bg-color': bgColor }, element, evaluate } ) => {
					const [ index, setIndex ] = useState( 0 );
					const entry = bgColor.find( ( { suffix } ) => suffix === 'default' );
					const colors = evaluate( entry );

					const clickHandler = useCallback(() => {
						setIndex( ( index + 1 ) % colors.length );
					}, [colors.length, index]);


					// Use mouseup event so this doesn't interfere with `data-wp-on--click`.
					element.props.onmouseup = clickHandler;
					element.props.style = { backgroundColor: colors[index] };
				}
			);
		}
	},
} );
