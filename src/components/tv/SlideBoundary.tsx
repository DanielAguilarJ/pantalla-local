"use client";

import { Component, type ReactNode } from "react";

interface Props {
  onError: () => void;
  children: ReactNode;
}

/** Si una escena revienta (datos raros, API no soportada en la TV), se salta al siguiente ítem en vez de congelarse. */
export class SlideBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  private timer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[tv] Error en el slide, se salta:", error);
    this.timer = setTimeout(this.props.onError, 300);
  }

  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
