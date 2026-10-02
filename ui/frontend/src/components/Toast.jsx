import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react'
import { soundManager } from '../utils/audio'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = {
      id,
      type: toast.type || 'info', // 'success' | 'warning' | 'error' | 'info'
      title: toast.title,
      message: toast.message,
      duration: toast.duration || 4000,
    }

    if (toast.type === 'error') {
      soundManager.playAlert()
    } else if (toast.type === 'success') {
      soundManager.playSuccess()
    } else {
      soundManager.playBlip()
    }

    setToasts((prev) => [...prev, newToast])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, newToast.duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => {
          let Icon = Info
          if (toast.type === 'success') Icon = CheckCircle2
          if (toast.type === 'warning') Icon = AlertTriangle
          if (toast.type === 'error') Icon = AlertOctagon

          return (
            <div key={toast.id} className={`toast-card toast-${toast.type} fade-in-up`}>
              <div className="toast-icon-wrap">
                <Icon size={18} />
              </div>
              <div className="toast-body">
                {toast.title && <div className="toast-title">{toast.title}</div>}
                <div className="toast-message">{toast.message}</div>
              </div>
              <button
                className="toast-close"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
              <div
                className="toast-progress-bar"
                style={{ animationDuration: `${toast.duration}ms` }}
              />
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    return {
      addToast: (t) => console.log('Toast fallback:', t),
      removeToast: () => {},
    }
  }
  return context
}
