import React from 'react';
import { AlertTriangle, RefreshCw, Shield } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("NetraSuraksha UI Error Caught by Boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="bg-slate-900/95 border border-red-500/40 rounded-2xl p-6 max-w-lg w-full text-center shadow-2xl backdrop-blur-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                <span>SOC UI Component Guard</span>
              </div>
              <h2 className="text-base font-bold text-white">Temporary Rendering Disruption</h2>
              <p className="text-xs text-slate-400">
                The surveillance interface caught an unexpected data format or rendering exception. The system has prevented a full crash.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left font-mono text-[11px] text-red-300 max-h-32 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/30"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset & Restore Surveillance View</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
