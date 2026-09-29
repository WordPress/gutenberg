import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';

const Separator = forwardRef< HTMLSpanElement, Record< never, never > >(
	function Separator( _props, ref ) {
		return (
			<span ref={ ref } aria-hidden="true" className={ styles.separator }>
				/
			</span>
		);
	}
);

export { Separator };
