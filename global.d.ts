import React from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module '@radix-ui/react-select' {
  export * from '@radix-ui/react-select';
}

declare module 'lucide-react' {
  export * from 'lucide-react';
}
declare module '@radix-ui/react-select' {
  const content: any;
  export = content;
}

declare module 'lucide-react' {
  const content: any;
  export = content;
}