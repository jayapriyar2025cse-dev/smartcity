import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Force clear stale localStorage seed
if (!['v5'].includes(localStorage.getItem('smartcity_seeded'))) {
  localStorage.removeItem('smartcity_complaints');
  localStorage.removeItem('smartcity_seeded');
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  componentDidCatch(error) { this.setState({ error }); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#0f172a', color: '#f1f5f9', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', padding: 32 }}>
          <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: 12, padding: 32, maxWidth: 600, width: '100%' }}>
            <div style={{ color: '#ef4444', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>🚨 App Error</div>
            <div style={{ color: '#fca5a5', fontSize: 14, marginBottom: 16 }}>{this.state.error.message}</div>
            <div style={{ color: '#64748b', fontSize: 12, whiteSpace: 'pre-wrap' }}>{this.state.error.stack}</div>
            <button onClick={() => window.location.reload()}
              style={{ marginTop: 20, padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
