// import React, { createElement, Component } from 'react'
// import ReactDOM from 'react-dom'
import cx from 'classnames';

import * as Icons from '../../external/dashicons'
import Button from '../button/Button'
import styles from './blocktoolbar.scss'

export default function BlockChangeToolbar(props) {
  const iconMap = {
    'p': Icons.EditorParagraphIcon,
    'h': Icons.EditorHeadingIcon,
    'blockquote': Icons.EditorQuoteIcon,
  }

  return props.isOpen ? null : (
    <div>
      {props.choices.map( (choice) =>
        ( <Button extraClass={ [] } icon={ iconMap[choice] } status={ (choice === props.selected) }/>)
      )}
    </div>
  )
}
