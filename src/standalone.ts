import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChatWidget } from './ChatWidget'
import type { StandaloneInitOptions } from './types'

function init(options: StandaloneInitOptions): { destroy: () => void } {
  const { containerId, ...widgetProps } = options

  let container: HTMLElement

  if (containerId) {
    const existing = document.getElementById(containerId)
    if (!existing) {
      throw new Error(`Container element with id "${containerId}" not found`)
    }
    container = existing
  } else {
    container = document.createElement('div')
    container.id = 'acrux-chat-root'
    document.body.appendChild(container)
  }

  const root = ReactDOM.createRoot(container)
  root.render(React.createElement(ChatWidget, widgetProps))

  return {
    destroy: () => {
      root.unmount()
      if (!containerId && container.parentNode) {
        container.parentNode.removeChild(container)
      }
    },
  }
}

export { init }
