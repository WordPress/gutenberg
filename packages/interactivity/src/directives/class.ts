import { type RefObject } from 'preact';
import { directive, isNonDefaultDirectiveSuffix } from '../hooks';
import { useInit } from '../utils';
import { PENDING_GETTER } from '../proxies/state';

// data-wp-class--[classname] Dynamic class binding.
directive(
	'class',
	( { directives: { class: classNames }, element, evaluate } ) => {
		classNames.filter( isNonDefaultDirectiveSuffix ).forEach( ( entry ) => {
			const className = entry.uniqueId
				? `${ entry.suffix }---${ entry.uniqueId }`
				: entry.suffix;
			let result = evaluate( entry );
			if ( result === PENDING_GETTER ) {
				return;
			}
			if ( typeof result === 'function' ) {
				result = result();
			}
			const currentClass = element.props.class || '';
			const classFinder = new RegExp(
				`(^|\\s)${ className }(\\s|$)`,
				'g'
			);
			if ( ! result ) {
				element.props.class = currentClass
					.replace( classFinder, ' ' )
					.trim();
			} else if ( ! classFinder.test( currentClass ) ) {
				element.props.class = currentClass
					? `${ currentClass } ${ className }`
					: className;
			}

			useInit( () => {
				/*
				 * This seems necessary because Preact doesn't change the class
				 * names on the hydration, so we have to do it manually. It doesn't
				 * need deps because it only needs to do it the first time.
				 */
				if ( ! result ) {
					(
						element.ref as RefObject< HTMLElement >
					 ).current!.classList.remove( className );
				} else {
					(
						element.ref as RefObject< HTMLElement >
					 ).current!.classList.add( className );
				}
			} );
		} );
	}
);
