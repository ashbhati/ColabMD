'use client'

import { Thread, ThreadProps } from '@liveblocks/react-ui'
import { ComponentProps } from 'react'

type CustomThreadProps = ComponentProps<typeof Thread>

export function CustomThread(props: CustomThreadProps) {
  return (
    <Thread
      {...props}
      showActions={true}
      showComposer="collapsed"
      showResolveAction
      showReactions
    />
  )
}
