import styles from './style.module.css';

function Separator() {
	return (
		<span aria-hidden="true" className={ styles.separator }>
			/
		</span>
	);
}

export { Separator };
