// import React, { createElement, Component } from 'react'
// import ReactDOM from 'react-dom'
import cx from 'classnames';

import * as Icons from '../../external/dashicons'
import Button from '../button/Button'
import styles from './blocktoolbar.scss'

export default function BlockAlignToolbar(props) {
    const iconMap = {
      'left': Icons.EditorAlignLeftIcon,
      'center': Icons.EditorAlignCenterIcon,
      'right': Icons.EditorAlignRightIcon
    }

		return props.isOpen ? null : (
      <div>
        {props.choices.map( (choice) =>
          ( <Button extraClass={ [styles.horizontal] } icon={ iconMap[choice] } status={ (choice === props.selected) }/>)
        )}
      </div>
		)
}