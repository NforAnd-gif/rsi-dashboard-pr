import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'Terjadi kesalahan saat menampilkan halaman.',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('React rendering error:', error, info.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="container page-content">
          <section className="empty-state">
            <h2>Halaman mengalami kendala</h2>
            <p>{this.state.message}</p>
            <button className="button button-primary" onClick={this.handleReload}>
              Muat ulang aplikasi
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
