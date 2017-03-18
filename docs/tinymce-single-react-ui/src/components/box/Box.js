import React, { createElement, Component } from 'react';
import ReactDOM from 'react-dom';
import styles from './box.scss';

export default function Box(props) {
  let r = props.rect

	return (r && r.width) ? (
    <div>
      <div className={styles.box} style={ {background: '#ccc', position: 'absolute', top: r.top + 'px', width: r.width + 'px', height: '2px', } }></div>
      <div className={styles.box} style={ {background: '#ccc', position: 'absolute', top: r.height + r.top + 'px', width: r.width + 'px', height: '2px' } }></div>
      <div className={styles.box} style={ {background: '#ccc', position: 'absolute', top: r.top + 'px', width: '2px', height: r.height + 'px' } }></div>
      <div className={styles.box} style={ {background: '#ccc', position: 'absolute', top: r.top + 'px', width: '2px', height: r.height + 'px', left: r.width + r.left + 'px' } }></div>
    </div>
	)
  : null
}
